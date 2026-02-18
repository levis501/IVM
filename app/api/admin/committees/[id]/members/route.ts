import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/committees/[id]/members - Add a member to a committee
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const committee = await prisma.committee.findUnique({ where: { id } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.committee.update({
    where: { id },
    data: {
      members: { connect: { id: userId } },
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'committee_member_added',
    entityType: 'Committee',
    entityId: id,
    success: true,
    details: {
      committeeName: committee.name,
      addedUserId: userId,
      addedUserEmail: targetUser.email,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Member added successfully' });
}

// DELETE /api/admin/committees/[id]/members - Remove a member from a committee
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const committee = await prisma.committee.findUnique({ where: { id } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.committee.update({
    where: { id },
    data: {
      members: { disconnect: { id: userId } },
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'committee_member_removed',
    entityType: 'Committee',
    entityId: id,
    success: true,
    details: {
      committeeName: committee.name,
      removedUserId: userId,
      removedUserEmail: targetUser.email,
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Member removed successfully' });
}
