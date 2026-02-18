import { NextResponse } from 'next/server';

// GET /api/auth/providers-info - Return which SSO providers are configured
export async function GET() {
  const providers: Array<{ id: string; name: string }> = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push({ id: 'google', name: 'Google' });
  }

  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push({ id: 'azure-ad', name: 'Microsoft' });
  }

  return NextResponse.json({ providers });
}
