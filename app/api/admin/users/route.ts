import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - List users
// ?all=true  → return all users with full details (for admin console)
// (default)  → return only verified users with minimal fields (for committee member management)
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  if (all) {
    // Return all users with full details for admin console
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        committees: { select: { id: true, name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const result = users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      unitNumber: u.unitNumber,
      verificationStatus: u.verificationStatus,
      roles: u.roles.map(r => r.name),
      committees: u.committees,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ users: result });
  }

  // Default: verified users only, minimal fields (committee member management)
  const users = await prisma.user.findMany({
    where: { verificationStatus: 'verified' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      unitNumber: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return NextResponse.json({ users });
}
