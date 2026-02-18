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

// DELETE /api/documents/[id]/permanent - Permanently delete from trash
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    return NextResponse.json(
      { error: 'Document must be in trash before permanently deleting' },
      { status: 400 }
    );
  }

  // Delete the file from .trash
  const basename = path.basename(document.filename);
  const trashPath = path.join(DOCUMENTS_BASE, document.committeeId, '.trash', basename);

  try {
    await fs.access(trashPath);
    await fs.unlink(trashPath);
  } catch {
    console.warn(`Could not permanently delete file ${trashPath}: file may not exist`);
  }

  // Delete the database record
  await prisma.document.delete({ where: { id: documentId } });

  await logAuditEvent({
    userId: session.user.id,
    action: 'document_permanently_deleted',
    entityType: 'Document',
    entityId: documentId,
    success: true,
    details: {
      committeeId: document.committeeId,
      title: document.title,
      filename: document.filename,
    },
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return NextResponse.json({ success: true, message: 'Document permanently deleted' });
}
