'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unitNumber: string;
  isResident: boolean;
  isOwner: boolean;
  createdAt: string;
}

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

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
};

const nameStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: '#333',
};

const unitBadgeStyle: React.CSSProperties = {
  backgroundColor: '#2d5016',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  flexWrap: 'wrap',
  marginBottom: '8px',
  fontSize: '0.95rem',
  color: '#555',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#333',
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  marginRight: '6px',
};

const commentBoxStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  resize: 'vertical' as const,
  minHeight: '60px',
  marginTop: '8px',
  marginBottom: '12px',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const approveButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const denyButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#b91c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#666',
  fontSize: '1.1rem',
};

const errorStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const successStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f0fdf4',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  marginBottom: '16px',
};

export default function VerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verify');
      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.users) {
        setPendingUsers(data.users);
      }
    } catch {
      setError('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      // Check if user has verifier role
      if (!session?.user?.roles?.includes('verifier')) {
        router.push('/');
        return;
      }
      fetchPendingUsers();
    }
  }, [status, session, router, fetchPendingUsers]);

  const handleAction = async (userId: string, action: 'approve' | 'deny') => {
    setProcessing(userId);
    setError('');
    setSuccess('');

    const comment = comments[userId] || '';

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${action} user`);
        return;
      }

      const user = pendingUsers.find(u => u.id === userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
      setSuccess(`${userName} has been ${action === 'approve' ? 'approved' : 'denied'} successfully.`);

      // Remove the processed user from the list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      // Clear the comment for the processed user
      setComments(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch {
      setError(`Failed to ${action} user. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>Verification Dashboard</h1>
        <p style={{ color: '#666' }}>Loading pending registrations...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Verification Dashboard</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>
        Review and verify pending user registrations.
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {pendingUsers.length === 0 ? (
        <div style={emptyStyle}>
          <p>No pending registrations to review.</p>
        </div>
      ) : (
        <div>
          <p style={{ color: '#555', marginBottom: '16px' }}>
            {pendingUsers.length} pending registration{pendingUsers.length !== 1 ? 's' : ''}
          </p>
          {pendingUsers.map(user => (
            <div key={user.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={nameStyle}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {user.isResident && (
                      <span style={{ ...roleBadgeStyle, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        Resident
                      </span>
                    )}
                    {user.isOwner && (
                      <span style={{ ...roleBadgeStyle, backgroundColor: '#fef3c7', color: '#92400e' }}>
                        Owner
                      </span>
                    )}
                  </div>
                </div>
                <span style={unitBadgeStyle}>Unit {user.unitNumber}</span>
              </div>

              <div style={detailRowStyle}>
                <span><span style={labelStyle}>Email:</span> {user.email}</span>
                <span><span style={labelStyle}>Phone:</span> {user.phone}</span>
              </div>
              <div style={{ ...detailRowStyle, fontSize: '0.85rem', color: '#888' }}>
                <span>Registered: {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}</span>
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', color: '#555', fontWeight: 'bold' }}>
                  Comment (optional):
                </label>
                <textarea
                  style={commentBoxStyle}
                  placeholder="Add a verification comment..."
                  value={comments[user.id] || ''}
                  onChange={e => setComments(prev => ({ ...prev, [user.id]: e.target.value }))}
                  disabled={processing === user.id}
                />
              </div>

              <div style={buttonRowStyle}>
                <button
                  style={{
                    ...denyButtonStyle,
                    ...(processing === user.id ? disabledButtonStyle : {}),
                  }}
                  onClick={() => handleAction(user.id, 'deny')}
                  disabled={processing === user.id}
                >
                  {processing === user.id ? 'Processing...' : 'Deny'}
                </button>
                <button
                  style={{
                    ...approveButtonStyle,
                    ...(processing === user.id ? disabledButtonStyle : {}),
                  }}
                  onClick={() => handleAction(user.id, 'approve')}
                  disabled={processing === user.id}
                >
                  {processing === user.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
