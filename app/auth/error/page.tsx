'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let title = 'Authentication Error';
  let message = 'An error occurred during authentication. Please try again.';
  let suggestion = '';

  switch (error) {
    case 'PendingVerification':
      title = 'Verification Pending';
      message = 'Your account is awaiting verification by a community administrator.';
      suggestion = 'You will receive an email once your account has been verified. This usually takes 1-2 business days.';
      break;
    case 'VerificationDenied':
      title = 'Verification Required';
      message = 'Your account verification requires additional information.';
      suggestion = 'Please check your email for instructions or contact the community administrator.';
      break;
    case 'Configuration':
      title = 'Configuration Error';
      message = 'There was a problem with the authentication system configuration.';
      suggestion = 'Please contact the system administrator.';
      break;
    case 'AccessDenied':
      title = 'Access Denied';
      message = 'You do not have permission to access this resource.';
      suggestion = 'If you believe this is an error, please contact support.';
      break;
    case 'Verification':
      title = 'Verification Failed';
      message = 'The magic link may have expired or is invalid.';
      suggestion = 'Please try signing in again to receive a new magic link.';
      break;
    default:
      title = 'Authentication Error';
      message = 'An unexpected error occurred during authentication.';
      suggestion = 'Please try again or contact support if the problem persists.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            {title}
          </div>
          <p className="text-gray-700 font-medium">
            {message}
          </p>
        </div>

        {suggestion && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm mb-6">
            {suggestion}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-[#2d5016] text-white py-2 px-4 rounded-md hover:bg-[#1f3710] transition-colors font-medium text-center"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block text-sm text-gray-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
