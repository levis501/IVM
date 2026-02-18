import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// POST /api/admin/users/bulk - Bulk operations on users
// Body: { action: 'assign_role' | 'add_committee', userIds: string[], roleName?: string, committeeId?: string }
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { action, userIds, roleName, committeeId } = body;

  if (!action || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: 'action and a non-empty userIds array are required' },
      { status: 400 }
    );
  }

  if (action !== 'assign_role' && action !== 'add_committee') {
    return NextResponse.json(
      { error: 'action must be "assign_role" or "add_committee"' },
      { status: 400 }
    );
  }

  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  if (action === 'assign_role') {
    if (!roleName) {
      return NextResponse.json({ error: 'roleName is required for assign_role action' }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return NextResponse.json({ error: `Role "${roleName}" not found` }, { status: 400 });
    }

    // Process each user
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { roles: true },
        });

        if (!user) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        const alreadyHasRole = user.roles.some(r => r.name === roleName);

        if (!alreadyHasRole) {
          await prisma.user.update({
            where: { id: userId },
            data: { roles: { connect: { id: role.id } } },
          });
        }

        await logAuditEvent({
          userId: session.user.id,
          action: 'user_roles_updated',
          entityType: 'User',
          entityId: userId,
          success: true,
          details: {
            adminEmail: admin.email,
            targetEmail: user.email,
            bulkAction: 'assign_role',
            roleName,
            wasAlreadyAssigned: alreadyHasRole,
          },
          ipAddress,
          userAgent,
        });

        results.push({ userId, success: true });
      } catch {
        results.push({ userId, success: false, error: 'Failed to update user' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      success: true,
      message: `Role "${roleName}" assigned to ${successCount} of ${userIds.length} users`,
      results,
    });
  }

  // action === 'add_committee'
  if (!committeeId) {
    return NextResponse.json({ error: 'committeeId is required for add_committee action' }, { status: 400 });
  }

  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  const results: { userId: string; success: boolean; error?: string }[] = [];

  for (const userId of userIds) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { committees: { select: { id: true } } },
      });

      if (!user) {
        results.push({ userId, success: false, error: 'User not found' });
        continue;
      }

      const alreadyMember = user.committees.some(c => c.id === committeeId);

      if (!alreadyMember) {
        await prisma.user.update({
          where: { id: userId },
          data: { committees: { connect: { id: committeeId } } },
        });
      }

      await logAuditEvent({
        userId: session.user.id,
        action: 'user_committees_updated',
        entityType: 'User',
        entityId: userId,
        success: true,
        details: {
          adminEmail: admin.email,
          targetEmail: user.email,
          bulkAction: 'add_committee',
          committeeName: committee.name,
          committeeId,
          wasAlreadyMember: alreadyMember,
        },
        ipAddress,
        userAgent,
      });

      results.push({ userId, success: true });
    } catch {
      results.push({ userId, success: false, error: 'Failed to update user' });
    }
  }

  const successCount = results.filter(r => r.success).length;
  return NextResponse.json({
    success: true,
    message: `${successCount} of ${userIds.length} users added to committee "${committee.name}"`,
    results,
  });
}
