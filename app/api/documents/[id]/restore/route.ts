import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import path from 'path';
import fs from 'fs/promises';

const DOCUMENTS_BASE = '/data/documents';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/documents/[id]/restore - Restore a deleted document (to archived state)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: true,
      committees: { select: { id: true } },
    },
  });

  if (!user || user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === document.committeeId);

  if (!isAdmin && !(isPublisher && isMember)) {
    return NextResponse.json(
      { error: 'Forbidden: publisher role and committee membership required' },
      { status: 403 }
    );
  }

  if (!document.deleted) {
    return NextResponse.json({ error: 'Document is not deleted' }, { status: 400 });
  }

  // Move file from .trash back to committee directory
  const basename = path.basename(document.filename);
  const trashPath = path.join(DOCUMENTS_BASE, document.committeeId, '.trash', basename);
  const destPath = path.join(DOCUMENTS_BASE, document.filename);
  const destDir = path.dirname(destPath);

  // Ensure committee dir exists
  try {
    await fs.access(destDir);
  } catch {
    await fs.mkdir(destDir, { recursive: true });
  }

  // Move back from trash
  try {
    await fs.access(trashPath);
    await fs.rename(trashPath, destPath);
  } catch {
    console.warn(`Could not restore document file ${trashPath}: file may not exist in trash`);
  }

  // Restore to archived state (not published, not deleted)
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      archived: true,
      published: false,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'document_restored',
    entityType: 'Document',
    entityId: documentId,
    success: true,
    details: {
      committeeId: document.committeeId,
      title: document.title,
      restoredToState: 'archived',
    },
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ document: updated });
}
