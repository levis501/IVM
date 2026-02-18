'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const pageStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '24px',
};

const welcomeStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: '#333',
  marginBottom: '24px',
  lineHeight: '1.6',
};

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
  marginTop: '16px',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'box-shadow 0.2s, transform 0.1s',
  display: 'block',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '8px',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#666',
  lineHeight: '1.5',
};

const statusCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  backgroundColor: '#f0fdf4',
};

const statusLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: '4px',
};

const statusValueStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: '#166534',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>Dashboard</h1>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isVerified = session.user.verificationStatus === 'verified';

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Dashboard</h1>

      <div style={welcomeStyle}>
        Welcome, {session.user.firstName} {session.user.lastName}
      </div>

      <div style={statusCardStyle}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={statusLabelStyle}>Account Status</div>
            <div style={{
              ...statusValueStyle,
              color: isVerified ? '#166534' : '#92400e',
            }}>
              {session.user.verificationStatus.charAt(0).toUpperCase() +
                session.user.verificationStatus.slice(1)}
            </div>
          </div>
          <div>
            <div style={statusLabelStyle}>Roles</div>
            <div style={{ ...statusValueStyle, color: '#333' }}>
              {session.user.roles?.join(', ') || 'None'}
            </div>
          </div>
        </div>
      </div>

      {!isVerified && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          Your account is pending verification. Some features may not be available until your account is verified.
        </div>
      )}

      <div style={cardGridStyle}>
        <Link href="/events" style={cardStyle}>
          <div style={cardTitleStyle}>Events</div>
          <div style={cardDescStyle}>
            View community events and activities.
            {isVerified ? ' Access all past and upcoming events.' : ' Some events require verification.'}
          </div>
        </Link>

        <Link href="/profile" style={cardStyle}>
          <div style={cardTitleStyle}>My Profile</div>
          <div style={cardDescStyle}>
            View and update your profile information.
          </div>
        </Link>

        {session.user.roles?.includes('verifier') && (
          <Link href="/admin/verify" style={cardStyle}>
            <div style={cardTitleStyle}>Verify Users</div>
            <div style={cardDescStyle}>
              Review and verify pending user registrations.
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
