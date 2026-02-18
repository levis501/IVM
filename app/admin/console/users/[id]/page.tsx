'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unitNumber: string;
  verificationStatus: string;
  roles: string[];
  committees: { id: string; name: string }[];
  createdAt: string;
}

interface Committee {
  id: string;
  name: string;
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '760px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  margin: '0 0 6px 0',
};

const subheadingStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.95rem',
  marginBottom: '28px',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '16px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '14px',
  paddingBottom: '6px',
  borderBottom: '2px solid #e5e7eb',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  color: '#444',
  marginBottom: '5px',
  fontSize: '0.9rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: '#f3f4f6',
  color: '#666',
  cursor: 'not-allowed',
};

const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const checkboxGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '8px',
};

const checkboxItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  backgroundColor: '#fafafa',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const checkboxItemCheckedStyle: React.CSSProperties = {
  ...checkboxItemStyle,
  border: '1px solid #86efac',
  backgroundColor: '#f0fdf4',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '8px',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '10px 28px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const cancelLinkStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  color: '#555',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '0.95rem',
  display: 'inline-block',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const errorStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const successStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#f0fdf4',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  marginBottom: '16px',
};

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
    verified: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
    denied: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  };
  return {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    ...(map[status] || { backgroundColor: '#f3f4f6', color: '#374151' }),
  };
}

const ALL_ROLES = ['dbadmin', 'publisher', 'calendar', 'verifier', 'user', 'owner', 'resident'];

export default function AdminUserEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [allCommittees, setAllCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedCommittees, setSelectedCommittees] = useState<Set<string>>(new Set());

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403) { router.push('/'); return; }
      if (res.status === 404) { router.push('/admin/console/users'); return; }
      const data = await res.json();
      const u = data.user as UserDetail;
      setUser(u);
      setFirstName(u.firstName);
      setLastName(u.lastName);
      setPhone(u.phone);
      setUnitNumber(u.unitNumber);
      setSelectedRoles(new Set(u.roles));
      setSelectedCommittees(new Set(u.committees.map((c: { id: string; name: string }) => c.id)));
    } catch {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch('/api/committees/visible');
      if (res.ok) {
        const data = await res.json();
        setAllCommittees(data.committees || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (!session?.user?.roles?.includes('dbadmin')) {
        router.push('/');
        return;
      }
      fetchUser();
      fetchCommittees();
    }
  }, [status, session, router, fetchUser, fetchCommittees]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const toggleCommittee = (id: string) => {
    setSelectedCommittees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !unitNumber.trim()) {
      setError('First name, last name, phone, and unit number are all required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          unitNumber: unitNumber.trim(),
          roles: Array.from(selectedRoles),
          committees: Array.from(selectedCommittees),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save changes');
        return;
      }

      setSuccess('User updated successfully!');
      // Update local user state
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>User not found.</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link href="/admin/console/users" style={backLinkStyle}>
        &larr; Back to User Management
      </Link>

      <h1 style={headingStyle}>
        Edit User: {user.firstName} {user.lastName}
      </h1>
      <p style={subheadingStyle}>
        Modify profile fields, role assignments, and committee memberships.
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Verification Status (read-only) */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontWeight: 'bold', color: '#444', fontSize: '0.9rem', marginRight: '10px' }}>
          Verification Status:
        </span>
        <span style={getStatusBadgeStyle(user.verificationStatus)}>
          {user.verificationStatus}
        </span>
      </div>

      {/* Profile Information */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>Profile Information</div>

        <div style={twoColStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="firstName">First Name <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              id="firstName"
              type="text"
              style={inputStyle}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              disabled={saving}
              maxLength={100}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="lastName">Last Name <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              id="lastName"
              type="text"
              style={inputStyle}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              disabled={saving}
              maxLength={100}
            />
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="email">Email (read-only)</label>
          <input
            id="email"
            type="email"
            style={readonlyInputStyle}
            value={user.email}
            readOnly
          />
        </div>

        <div style={twoColStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="phone">Phone <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              id="phone"
              type="text"
              style={inputStyle}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={saving}
              maxLength={20}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="unitNumber">Unit Number <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              id="unitNumber"
              type="text"
              style={inputStyle}
              value={unitNumber}
              onChange={e => setUnitNumber(e.target.value)}
              disabled={saving}
              maxLength={6}
            />
          </div>
        </div>
      </div>

      {/* Role Assignment */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>Role Assignment</div>
        <p style={{ fontSize: '0.87rem', color: '#666', marginBottom: '12px' }}>
          Select all roles that apply. Roles control access permissions across the site.
        </p>
        <div style={checkboxGridStyle}>
          {ALL_ROLES.map(role => {
            const checked = selectedRoles.has(role);
            return (
              <label
                key={role}
                style={checked ? checkboxItemCheckedStyle : checkboxItemStyle}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRole(role)}
                  disabled={saving}
                  style={{ accentColor: '#00693f' }}
                />
                <span style={{ fontWeight: checked ? 'bold' : 'normal', color: '#333' }}>
                  {role}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Committee Membership */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>Committee Membership</div>
        {allCommittees.length === 0 ? (
          <p style={{ fontSize: '0.87rem', color: '#888', fontStyle: 'italic' }}>No committees available.</p>
        ) : (
          <div style={checkboxGridStyle}>
            {allCommittees.map(committee => {
              const checked = selectedCommittees.has(committee.id);
              return (
                <label
                  key={committee.id}
                  style={checked ? checkboxItemCheckedStyle : checkboxItemStyle}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCommittee(committee.id)}
                    disabled={saving}
                    style={{ accentColor: '#00693f' }}
                  />
                  <span style={{ fontWeight: checked ? 'bold' : 'normal', color: '#333', fontSize: '0.88rem' }}>
                    {committee.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Save/Cancel */}
      <div style={buttonRowStyle}>
        <button
          style={{ ...saveButtonStyle, ...(saving ? disabledButtonStyle : {}) }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <Link href="/admin/console/users" style={cancelLinkStyle}>
          Cancel
        </Link>
      </div>

      {/* Timestamps */}
      <div style={{ marginTop: '28px', fontSize: '0.82rem', color: '#aaa' }}>
        User ID: {user.id} &bull; Joined: {new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </div>
    </div>
  );
}
