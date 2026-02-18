import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication (any logged-in user)
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/events',
];

// Routes that require verifier role
const VERIFIER_ROUTES = [
  '/admin/verify',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isAuthRequired = AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
  const isVerifierRoute = VERIFIER_ROUTES.some(route => pathname.startsWith(route));

  if (!isAuthRequired && !isVerifierRoute) {
    return NextResponse.next();
  }

  // Get the JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/events/:path*',
    '/admin/:path*',
  ],
};
