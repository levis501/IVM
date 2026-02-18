import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collectMetrics, checkAlerts } from '@/lib/monitoring';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes('dbadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const metrics = await collectMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes('dbadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await checkAlerts();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check alerts' },
      { status: 500 }
    );
  }
}
