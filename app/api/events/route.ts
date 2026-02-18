import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List events with past event filtering based on verification status
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Calculate the start of the current calendar month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Determine if user is verified
  const isVerified = session?.user?.verificationStatus === 'verified';

  let events;
  if (isVerified) {
    // Verified users see all events (past and current)
    events = await prisma.event.findMany({
      orderBy: { startAt: 'desc' },
    });
  } else {
    // Anonymous/non-verified users see only events from current month onward
    events = await prisma.event.findMany({
      where: {
        startAt: { gte: currentMonthStart },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  return NextResponse.json({
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
    })),
    isVerified,
    currentMonthStart: currentMonthStart.toISOString(),
  });
}
