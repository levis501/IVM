import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/committees/visible
 * Returns committees visible to the current authenticated user
 *
 * Visibility rules:
 * - Committees with published documents (visible to all verified users)
 * - Committees where user is a member (visible even if no published docs)
 * - Committees where user has publisher role (visible even if no published docs)
 */
export async function GET() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with roles and committee memberships
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        committees: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has publisher role
    const hasPublisherRole = user.roles.some(role => role.name === 'publisher');

    // Get user's committee memberships
    const userCommitteeIds = user.committees.map(c => c.id);

    // Build visibility query
    const committees = await prisma.committee.findMany({
      where: {
        OR: [
          // Committees with published documents (visible to all verified users)
          {
            documents: {
              some: {
                published: true,
              },
            },
          },
          // Committees where user is a member
          {
            id: {
              in: userCommitteeIds,
            },
          },
          // If user has publisher role, show all committees
          ...(hasPublisherRole ? [{}] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ committees });
  } catch (error) {
    console.error('[API] Error fetching visible committees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
