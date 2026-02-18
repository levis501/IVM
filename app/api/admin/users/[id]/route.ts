import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GET /api/admin/users/[id] - Fetch single user with roles and committees
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!admin || !admin.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: true,
      committees: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      unitNumber: user.unitNumber,
      verificationStatus: user.verificationStatus,
      roles: user.roles.map(r => r.name),
      committees: user.committees,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

// PUT /api/admin/users/[id] - Update user profile, roles, and committees
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true },
  });

  if (!admin || !admin.roles.some(r => r.name === 'dbadmin')) {
    return NextResponse.json({ error: 'Forbidden: dbadmin role required' }, { status: 403 });
  }

  const { id } = await params;

  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: { roles: true, committees: true },
  });

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const { firstName, lastName, phone, unitNumber, roles, committees } = body;

  // Validate required fields
  if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !unitNumber?.trim()) {
    return NextResponse.json(
      { error: 'firstName, lastName, phone, and unitNumber are required' },
      { status: 400 }
    );
  }

  // Validate roles: must be an array of strings
  if (!Array.isArray(roles)) {
    return NextResponse.json({ error: 'roles must be an array of role names' }, { status: 400 });
  }

  // Validate committees: must be an array of IDs
  if (!Array.isArray(committees)) {
    return NextResponse.json({ error: 'committees must be an array of committee IDs' }, { status: 400 });
  }

  // Resolve role records
  const roleRecords = await prisma.role.findMany({
    where: { name: { in: roles } },
  });

  if (roleRecords.length !== roles.length) {
    const foundNames = roleRecords.map(r => r.name);
    const invalid = roles.filter((n: string) => !foundNames.includes(n));
    return NextResponse.json({ error: `Invalid role names: ${invalid.join(', ')}` }, { status: 400 });
  }

  // Validate committee IDs
  const committeeRecords = await prisma.committee.findMany({
    where: { id: { in: committees } },
  });

  if (committeeRecords.length !== committees.length) {
    return NextResponse.json({ error: 'One or more committee IDs are invalid' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Track old values for audit log
  const oldRoles = existingUser.roles.map(r => r.name);
  const oldCommittees = existingUser.committees.map(c => c.id);

  // Update user profile
  await prisma.user.update({
    where: { id },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      unitNumber: unitNumber.trim(),
      roles: { set: roleRecords.map(r => ({ id: r.id })) },
      committees: { set: committeeRecords.map(c => ({ id: c.id })) },
    },
  });

  // Audit log: profile update
  const profileDiff: Record<string, unknown> = {};
  if (firstName.trim() !== existingUser.firstName) profileDiff.firstName = { from: existingUser.firstName, to: firstName.trim() };
  if (lastName.trim() !== existingUser.lastName) profileDiff.lastName = { from: existingUser.lastName, to: lastName.trim() };
  if (phone.trim() !== existingUser.phone) profileDiff.phone = { from: existingUser.phone, to: phone.trim() };
  if (unitNumber.trim() !== existingUser.unitNumber) profileDiff.unitNumber = { from: existingUser.unitNumber, to: unitNumber.trim() };

  if (Object.keys(profileDiff).length > 0) {
    await logAuditEvent({
      userId: session.user.id,
      action: 'user_profile_updated',
      entityType: 'User',
      entityId: id,
      success: true,
      details: { adminEmail: admin.email, targetEmail: existingUser.email, changes: profileDiff },
      ipAddress,
      userAgent,
    });
  }

  // Audit log: roles update
  const rolesAdded = roles.filter((r: string) => !oldRoles.includes(r));
  const rolesRemoved = oldRoles.filter((r: string) => !roles.includes(r));
  if (rolesAdded.length > 0 || rolesRemoved.length > 0) {
    await logAuditEvent({
      userId: session.user.id,
      action: 'user_roles_updated',
      entityType: 'User',
      entityId: id,
      success: true,
      details: {
        adminEmail: admin.email,
        targetEmail: existingUser.email,
        rolesAdded,
        rolesRemoved,
        newRoles: roles,
      },
      ipAddress,
      userAgent,
    });
  }

  // Audit log: committees update
  const committeesAdded = committees.filter((c: string) => !oldCommittees.includes(c));
  const committeesRemoved = oldCommittees.filter((c: string) => !committees.includes(c));
  if (committeesAdded.length > 0 || committeesRemoved.length > 0) {
    await logAuditEvent({
      userId: session.user.id,
      action: 'user_committees_updated',
      entityType: 'User',
      entityId: id,
      success: true,
      details: {
        adminEmail: admin.email,
        targetEmail: existingUser.email,
        committeesAdded,
        committeesRemoved,
      },
      ipAddress,
      userAgent,
    });
  }

  // Fetch updated user to return
  const updatedUser = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: true,
      committees: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: updatedUser!.id,
      firstName: updatedUser!.firstName,
      lastName: updatedUser!.lastName,
      email: updatedUser!.email,
      phone: updatedUser!.phone,
      unitNumber: updatedUser!.unitNumber,
      verificationStatus: updatedUser!.verificationStatus,
      roles: updatedUser!.roles.map(r => r.name),
      committees: updatedUser!.committees,
    },
  });
}
