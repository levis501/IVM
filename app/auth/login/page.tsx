'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface SSOProvider {
  id: string;
  name: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);

  useEffect(() => {
    fetch('/api/auth/providers-info')
      .then(res => res.json())
      .then(data => setSsoProviders(data.providers || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        if (result.error === 'PendingVerification' || result.error === 'VerificationDenied') {
          window.location.href = `/auth/error?error=${result.error}`;
          return;
        }

        let errorMessage = result.error;

        if (result.error === 'EmailSignin') {
          errorMessage = 'Failed to send magic link email. Please check the server logs for details. This is usually due to missing or incorrect email credentials in the .env file.';
        } else if (result.error === 'Configuration') {
          errorMessage = 'Email service is not properly configured. Please contact the administrator.';
        } else if (result.error.includes('rate limit')) {
          errorMessage = result.error;
        }

        setError(errorMessage);
        console.error('Login error:', result.error);
      } else {
        window.location.href = '/auth/verify-request';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Login exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Indian Village Manor
          </div>
          <p className="text-gray-600">Sign in to access your community portal</p>
        </div>

        {/* SSO Buttons */}
        {ssoProviders.length > 0 && (
          <div className="space-y-3 mb-6">
            {ssoProviders.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleSSOSignIn(provider.id)}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                {provider.id === 'google' && (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {provider.id === 'azure-ad' && (
                  <svg width="20" height="20" viewBox="0 0 23 23">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M1 12h10v10H1z" />
                    <path fill="#7fba00" d="M12 1h10v10H12z" />
                    <path fill="#ffb900" d="M12 12h10v10H12z" />
                  </svg>
                )}
                Sign in with {provider.name}
              </button>
            ))}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with email</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="your.email@example.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d5016] text-white py-2 px-4 rounded-md hover:bg-[#1f3710] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <div>
            <Link href="/auth/forgot-email" className="text-sm text-[#2d5016] hover:underline">
              Forgot your email?
            </Link>
          </div>
          <div>
            <span className="text-sm text-gray-600">New here? </span>
            <Link href="/register" className="text-sm text-[#2d5016] hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
