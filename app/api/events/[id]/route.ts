import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GET: Get a single event by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() || null,
      createdAt: event.createdAt.toISOString(),
      createdBy: event.createdBy,
    },
  });
}

// PUT: Update an event (calendar role or dbadmin required)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = session.user.roles || [];
  const canManageEvents = roles.includes('calendar') || roles.includes('dbadmin');

  if (!canManageEvents) {
    return NextResponse.json({ error: 'Forbidden: calendar role required' }, { status: 403 });
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  let body: { title?: string; description?: string; startAt?: string; endAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, startAt, endAt } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!startAt || isNaN(Date.parse(startAt))) {
    return NextResponse.json({ error: 'Valid start date/time is required' }, { status: 400 });
  }

  const startDate = new Date(startAt);
  let endDate: Date | null = null;

  if (endAt) {
    if (isNaN(Date.parse(endAt))) {
      return NextResponse.json({ error: 'Invalid end date/time' }, { status: 400 });
    }
    endDate = new Date(endAt);
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date/time must be after start date/time' }, { status: 400 });
    }
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      startAt: startDate,
      endAt: endDate,
      updatedBy: session.user.id,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: 'event_updated',
    entityType: 'Event',
    entityId: event.id,
    details: { title: event.title, startAt: event.startAt.toISOString() },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    success: true,
  });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() || null,
      createdAt: event.createdAt.toISOString(),
    },
  });
}

// DELETE: Delete an event (calendar role or dbadmin required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = session.user.roles || [];
  const canManageEvents = roles.includes('calendar') || roles.includes('dbadmin');

  if (!canManageEvents) {
    return NextResponse.json({ error: 'Forbidden: calendar role required' }, { status: 403 });
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });

  await logAuditEvent({
    userId: session.user.id,
    action: 'event_deleted',
    entityType: 'Event',
    entityId: id,
    details: { title: existing.title, startAt: existing.startAt.toISOString() },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    success: true,
  });

  return NextResponse.json({ success: true });
}
