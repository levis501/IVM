'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    unitNumber: '',
    isResident: false,
    isOwner: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.isResident && !formData.isOwner) {
      setError('Please select at least one: Resident or Owner');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to confirmation page
      router.push('/register/confirmation');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Registration exception:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Indian Village Manor
          </div>
          <p className="text-gray-600">Register for community access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="John"
              maxLength={100}
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="Doe"
              maxLength={100}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Unit Number */}
          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="unitNumber"
              name="unitNumber"
              required
              value={formData.unitNumber}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2d5016] focus:border-transparent disabled:opacity-50"
              placeholder="123A"
              maxLength={6}
              pattern="[a-zA-Z0-9]+"
              title="Unit number must be alphanumeric (max 6 characters)"
            />
          </div>

          {/* Resident/Owner Checkboxes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isResident"
                  checked={formData.isResident}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-4 w-4 text-[#2d5016] focus:ring-[#2d5016] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Resident</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isOwner"
                  checked={formData.isOwner}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-4 w-4 text-[#2d5016] focus:ring-[#2d5016] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Owner</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select at least one</p>
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#2d5016] hover:underline">
              Sign in
            </Link>
          </p>
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
