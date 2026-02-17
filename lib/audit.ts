import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

const LOG_DIR = process.env.AUDIT_LOG_DIR || (process.env.NODE_ENV === 'production' ? '/data/logs' : './data/logs');

// Ensure log directory exists
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Simple log format: timestamp | userId | userName | action | success | details
function formatLogEntry(entry: AuditLogEntry): string {
  const timestamp = new Date().toISOString();
  const userId = entry.userId || 'anonymous';
  const userName = entry.userName || entry.userEmail || 'anonymous';
  const action = entry.action;
  const success = entry.success ? 'SUCCESS' : 'FAILED';
  const details = entry.details ? JSON.stringify(entry.details) : '';
  const ip = entry.ipAddress || 'unknown';

  return `${timestamp} | ${userId} | ${userName} | ${action} | ${success} | ${ip} | ${details}\n`;
}

// Write to daily log file
async function writeToLogFile(entry: AuditLogEntry): Promise<void> {
  try {
    ensureLogDirectory();

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(LOG_DIR, `auth-${date}.log`);

    const logLine = formatLogEntry(entry);

    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error writing to audit log file:', error);
    // Don't throw - logging should not break application flow
  }
}

// Write to database AuditLog table
async function writeToDatabase(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        entityType: entry.entityType || null,
        entityId: entry.entityId || null,
        details: (entry.details || {}) as Prisma.JsonObject,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Error writing to audit log database:', error);
    // Don't throw - logging should not break application flow
  }
}

// Main audit logging function
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  // Write to both file and database
  await Promise.all([
    writeToLogFile(entry),
    writeToDatabase(entry),
  ]);
}

// Convenience functions for common auth events
export async function logLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  userId?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail: email,
    userName: email,
    action: 'LOGIN_ATTEMPT',
    success,
    ipAddress,
    userAgent,
    details: reason ? { reason } : undefined,
  });
}

export async function logMagicLinkRequest(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    userEmail: email,
    userName: email,
    action: 'MAGIC_LINK_REQUEST',
    success,
    ipAddress,
    userAgent,
    details: reason ? { reason } : undefined,
  });
}

export async function logLogout(
  userId: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail,
    userName: userEmail,
    action: 'LOGOUT',
    success: true,
    ipAddress,
    userAgent,
  });
}

export async function logSessionCreated(
  userId: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail,
    userName: userEmail,
    action: 'SESSION_CREATED',
    success: true,
    ipAddress,
    userAgent,
  });
}

// Rate limiting tracking (in-memory for M03, will be improved in M13)
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAttempt > oneHour) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export async function checkRateLimit(
  identifier: string, // email or IP
  limitType: 'login' | 'magic-link',
  maxAttempts: number,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    // New window or expired
    entry = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // Update existing entry
  entry.count += 1;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - entry.count);
  const resetAt = new Date(entry.firstAttempt + windowMs);

  return { allowed, remaining, resetAt };
}

// Track failed login attempts per user
const failedLoginAttempts = new Map<string, number>();

export function incrementFailedLoginAttempts(email: string): number {
  const current = failedLoginAttempts.get(email) || 0;
  const newCount = current + 1;
  failedLoginAttempts.set(email, newCount);
  return newCount;
}

export function resetFailedLoginAttempts(email: string): void {
  failedLoginAttempts.delete(email);
}

export function getFailedLoginAttempts(email: string): number {
  return failedLoginAttempts.get(email) || 0;
}
