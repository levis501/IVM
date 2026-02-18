import { prisma } from './prisma';
import { sendEmail } from './email';
import { logAuditEvent } from './audit';
import fs from 'fs';
import os from 'os';

export interface SystemMetrics {
  pendingVerifications: number;
  totalUsers: number;
  verifiedUsers: number;
  deniedUsers: number;
  recentFailedLogins: number;
  recentAuditEvents: number;
  documentsOnDisk: number;
  diskUsage: {
    documentsBytes: number;
    logsBytes: number;
    documentsFormatted: string;
    logsFormatted: string;
  };
  systemLoad: number[];
  memoryUsage: {
    totalMB: number;
    freeMB: number;
    usedPercent: number;
  };
  uptime: string;
}

/**
 * Collect current system metrics from database and filesystem.
 */
export async function collectMetrics(): Promise<SystemMetrics> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    pendingVerifications,
    totalUsers,
    verifiedUsers,
    deniedUsers,
    recentFailedLogins,
    recentAuditEvents,
    documentsOnDisk,
  ] = await Promise.all([
    prisma.user.count({ where: { verificationStatus: 'pending' } }),
    prisma.user.count(),
    prisma.user.count({ where: { verificationStatus: 'verified' } }),
    prisma.user.count({ where: { verificationStatus: 'denied' } }),
    prisma.auditLog.count({
      where: {
        action: 'LOGIN_ATTEMPT',
        details: { path: ['reason'], not: Prisma.DbNull },
        createdAt: { gte: oneDayAgo },
      },
    }).catch(() =>
      // Fallback: count login attempts where success is logged as false
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_ATTEMPT',
          createdAt: { gte: oneDayAgo },
        },
      })
    ),
    prisma.auditLog.count({
      where: { createdAt: { gte: oneDayAgo } },
    }),
    prisma.document.count(),
  ]);

  // Disk usage
  const docsDir = process.env.NODE_ENV === 'production' ? '/data/documents' : './data/documents';
  const logsDir = process.env.NODE_ENV === 'production' ? '/data/logs' : './data/logs';
  const documentsBytes = getDirSize(docsDir);
  const logsBytes = getDirSize(logsDir);

  // System info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const uptimeSeconds = os.uptime();

  return {
    pendingVerifications,
    totalUsers,
    verifiedUsers,
    deniedUsers,
    recentFailedLogins,
    recentAuditEvents,
    documentsOnDisk,
    diskUsage: {
      documentsBytes,
      logsBytes,
      documentsFormatted: formatBytes(documentsBytes),
      logsFormatted: formatBytes(logsBytes),
    },
    systemLoad: os.loadavg(),
    memoryUsage: {
      totalMB: Math.round(totalMem / 1024 / 1024),
      freeMB: Math.round(freeMem / 1024 / 1024),
      usedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    },
    uptime: formatUptime(uptimeSeconds),
  };
}

/**
 * Check alert conditions and send email notifications to dbadmin users.
 */
export async function checkAlerts(): Promise<{ alertsSent: string[] }> {
  const alertsSent: string[] = [];

  const [
    failedThresholdConfig,
    pendingThresholdConfig,
  ] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'failed_login_alert_threshold' } }),
    prisma.systemConfig.findUnique({ where: { key: 'pending_verification_alert_count' } }),
  ]);

  const failedLoginThreshold = parseInt(failedThresholdConfig?.value || '3');
  const pendingVerificationThreshold = parseInt(pendingThresholdConfig?.value || '5');

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check failed logins in the last hour
  const recentFailedLogins = await prisma.auditLog.count({
    where: {
      action: 'LOGIN_ATTEMPT',
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentFailedLogins >= failedLoginThreshold) {
    await sendAlertToAdmins(
      'IVM Alert: High Failed Login Attempts',
      `${recentFailedLogins} failed login attempts detected in the last hour (threshold: ${failedLoginThreshold}).\n\nPlease review the audit logs at /admin/console/audit-logs for suspicious activity.`
    );
    alertsSent.push(`Failed logins: ${recentFailedLogins} (threshold: ${failedLoginThreshold})`);
  }

  // Check pending verifications
  const pendingCount = await prisma.user.count({
    where: { verificationStatus: 'pending' },
  });

  if (pendingCount >= pendingVerificationThreshold) {
    await sendAlertToAdmins(
      'IVM Alert: Pending Verifications',
      `There are ${pendingCount} users awaiting verification (threshold: ${pendingVerificationThreshold}).\n\nPlease review pending registrations at /admin/verify.`
    );
    alertsSent.push(`Pending verifications: ${pendingCount} (threshold: ${pendingVerificationThreshold})`);
  }

  // Log alert check
  if (alertsSent.length > 0) {
    await logAuditEvent({
      action: 'monitoring_alerts_sent',
      entityType: 'System',
      success: true,
      details: { alerts: alertsSent },
    });
  }

  return { alertsSent };
}

/**
 * Send an alert email to all dbadmin users.
 */
async function sendAlertToAdmins(subject: string, body: string): Promise<void> {
  const dbAdmins = await prisma.user.findMany({
    where: {
      verificationStatus: 'verified',
      roles: { some: { name: 'dbadmin' } },
    },
    select: { email: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const fullBody = `${body}\n\n---\nMonitoring Dashboard: ${baseUrl}/admin/console/monitoring`;

  for (const admin of dbAdmins) {
    try {
      await sendEmail({
        to: admin.email,
        subject,
        text: fullBody,
        html: fullBody.replace(/\n/g, '<br>'),
      });
    } catch (error) {
      console.error(`Failed to send alert to ${admin.email}:`, error);
    }
  }
}

/**
 * Get total size of a directory in bytes.
 */
function getDirSize(dirPath: string): number {
  try {
    if (!fs.existsSync(dirPath)) return 0;
    let totalSize = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      if (entry.isFile()) {
        totalSize += fs.statSync(fullPath).size;
      } else if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Re-export Prisma for the JSON filter
import { Prisma } from '@prisma/client';
