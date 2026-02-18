import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryAuditLogs, cleanupAuditLogs, logAuditEvent } from '@/lib/audit';

async function isDbAdmin(): Promise<{ authorized: boolean; session: { user: { id: string; email: string; roles: string[] } } | null }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes('dbadmin')) {
    return { authorized: false, session: null };
  }
  return { authorized: true, session: session as { user: { id: string; email: string; roles: string[] } } };
}

// GET /api/admin/audit-logs - Query audit logs with filters
export async function GET(request: NextRequest) {
  const { authorized } = await isDbAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');
  const exportCsv = searchParams.get('export') === 'csv';

  if (exportCsv) {
    // Export all matching logs as CSV (no pagination)
    const { logs } = await queryAuditLogs({
      userId, action, entityType, dateFrom, dateTo,
      page: 1, pageSize: 10000,
    });

    const csvHeader = 'Timestamp,User ID,Action,Entity Type,Entity ID,IP Address,Details\n';
    const csvRows = logs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        log.createdAt ? new Date(log.createdAt as string).toISOString() : '',
        log.userId || 'anonymous',
        log.action || '',
        log.entityType || '',
        log.entityId || '',
        log.ipAddress || '',
        `"${details}"`,
      ].join(',');
    }).join('\n');

    return new NextResponse(csvHeader + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  const result = await queryAuditLogs({
    userId, action, entityType, dateFrom, dateTo,
    page, pageSize,
  });

  // Also get distinct action types for the filter dropdown
  const { prisma } = await import('@/lib/prisma');
  const actions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  });

  return NextResponse.json({
    ...result,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
    actions: actions.map(a => a.action),
  });
}

// POST /api/admin/audit-logs/cleanup - Run log retention cleanup
export async function POST(request: NextRequest) {
  const { authorized, session } = await isDbAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get('action') !== 'cleanup') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const result = await cleanupAuditLogs();

  await logAuditEvent({
    userId: session!.user.id,
    userName: session!.user.email,
    action: 'AUDIT_LOG_CLEANUP',
    entityType: 'AuditLog',
    success: true,
    details: {
      authenticatedDeleted: result.authenticatedDeleted,
      anonymousDeleted: result.anonymousDeleted,
    },
  });

  return NextResponse.json({
    message: 'Cleanup completed',
    ...result,
  });
}
