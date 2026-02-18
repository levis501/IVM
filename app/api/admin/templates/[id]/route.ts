import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GET /api/admin/templates/[id] - Fetch a single email template
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

  const template = await prisma.emailTemplate.findUnique({ where: { id } });

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({
    template: {
      id: template.id,
      key: template.key,
      subject: template.subject,
      body: template.body,
      variables: template.variables ? JSON.parse(template.variables) : [],
      updatedBy: template.updatedBy,
      updatedAt: template.updatedAt.toISOString(),
    },
  });
}

// PUT /api/admin/templates/[id] - Update template subject and body
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

  const existingTemplate = await prisma.emailTemplate.findUnique({ where: { id } });

  if (!existingTemplate) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const body = await request.json();
  const { subject, body: templateBody } = body;

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }

  if (!templateBody?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject: subject.trim(),
      body: templateBody.trim(),
      updatedBy: session.user.id,
    },
  });

  // Audit log
  const changes: Record<string, unknown> = {};
  if (subject.trim() !== existingTemplate.subject) {
    changes.subject = { from: existingTemplate.subject, to: subject.trim() };
  }
  if (templateBody.trim() !== existingTemplate.body) {
    changes.bodyChanged = true;
    changes.bodyLengthFrom = existingTemplate.body.length;
    changes.bodyLengthTo = templateBody.trim().length;
  }

  await logAuditEvent({
    userId: session.user.id,
    action: 'template_updated',
    entityType: 'EmailTemplate',
    entityId: id,
    success: true,
    details: { adminEmail: admin.email, templateKey: existingTemplate.key, changes },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, message: 'Template updated successfully' });
}
