'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotEmailPage() {
  const [unitNumber, setUnitNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/recover-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unitNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send email reminder.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">✅</div>
            <div className="text-3xl font-serif text-[#2d5016] mb-2">
              Email Sent
            </div>
            <p className="text-gray-600">
              An email reminder has been sent to all verified users associated with unit {unitNumber}.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-6">
            <p>Please check your email inbox for the reminder with your registered email address.</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-[#2d5016] text-white py-2 px-4 rounded-md hover:bg-[#1f3710] transition-colors font-medium text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Forgot Your Email?
          </div>
          <p className="text-gray-600">
            Enter your unit number to receive an email reminder
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-6">
          <p className="font-medium mb-1">How this works:</p>
          <p className="text-xs">
            We&apos;ll send an email reminder to all verified users associated with your unit number.
            The email will contain your registered email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number
            </label>
            <input
              type="text"
              id="unitNumber"
              name="unitNumber"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="e.g., 101, A5, etc."
              maxLength={6}
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
            {loading ? 'Sending...' : 'Send Email Reminder'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-[#2d5016] hover:underline">
            ← Back to login
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
