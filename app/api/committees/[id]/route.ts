import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/committees/[id] - Get committee detail with visibility check
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: true,
      committees: { select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.verificationStatus !== 'verified') {
    return NextResponse.json({ error: 'Forbidden: verified status required' }, { status: 403 });
  }

  const { id } = await params;

  const isAdmin = user.roles.some(r => r.name === 'dbadmin');
  const isPublisher = user.roles.some(r => r.name === 'publisher');
  const isMember = user.committees.some(c => c.id === id);

  const committee = await prisma.committee.findUnique({
    where: { id },
    include: {
      documents: {
        where: { deleted: false, published: true },
        select: {
          id: true,
          title: true,
          uploadedAt: true,
          archived: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          unitNumber: true,
        },
      },
      _count: {
        select: {
          members: true,
          documents: {
            where: { deleted: false, published: true },
          },
        },
      },
    },
  });

  if (!committee) {
    return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
  }

  // Check visibility: admin/publisher can see any committee
  // Others can only see if they are members or the committee has published docs
  const hasPublishedDocs = committee._count.documents > 0;
  const canView = isAdmin || isPublisher || isMember || hasPublishedDocs;

  if (!canView) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    committee,
    viewerInfo: {
      isAdmin,
      isPublisher,
      isMember,
    },
  });
}
