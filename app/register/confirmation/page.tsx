import Link from 'next/link';

export default function RegistrationConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Indian Village Manor
          </div>
          <p className="text-gray-600">Registration Complete</p>
        </div>

        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Thank You for Registering!
            </h2>
            <p className="text-gray-700">
              Your registration has been submitted successfully.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Verification Required
            </h3>
            <p className="text-sm text-yellow-800">
              Your account is currently pending verification. You will receive an email
              notification once your account has been reviewed and approved by our verification team.
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Our verification team will review your registration</li>
              <li>You&apos;ll receive an email once your account is approved</li>
              <li>After approval, you can log in to access community features</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-[#2d5016] text-white py-2 px-4 rounded-md hover:bg-[#1f3710] transition-colors font-medium text-center"
          >
            Return to Home
          </Link>

          <p className="text-center text-sm text-gray-600">
            Questions? Please contact the office.
          </p>
        </div>
      </div>
    </div>
  );
}
