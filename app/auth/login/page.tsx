'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // Map NextAuth error codes to user-friendly messages
        let errorMessage = result.error;

        if (result.error === 'EmailSignin') {
          errorMessage = 'Failed to send magic link email. Please check the server logs for details. This is usually due to missing or incorrect email credentials in the .env file.';
        } else if (result.error === 'Configuration') {
          errorMessage = 'Email service is not properly configured. Please contact the administrator.';
        } else if (result.error.includes('rate limit')) {
          errorMessage = result.error; // Already a good message
        }

        setError(errorMessage);
        console.error('Login error:', result.error);
      } else {
        // Redirect to verify request page
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Indian Village Manor
          </div>
          <p className="text-gray-600">Sign in to access your community portal</p>
        </div>

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

        <div className="mt-6 text-center">
          <Link href="/auth/forgot-email" className="text-sm text-[#2d5016] hover:underline">
            Forgot your email?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
