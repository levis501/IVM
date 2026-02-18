'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserRow {
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
  maxWidth: '1100px',
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
  marginBottom: '24px',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '16px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: '16px',
};

const searchInputStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '200px',
  padding: '9px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  padding: '9px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  backgroundColor: '#fff',
};

const tableWrapperStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden',
  overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '0.9rem',
};

const theadStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  position: 'sticky' as const,
  top: 0,
  zIndex: 1,
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left' as const,
  fontWeight: 'bold',
  color: '#444',
  whiteSpace: 'nowrap' as const,
  borderBottom: '2px solid #ddd',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
  verticalAlign: 'middle' as const,
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginRight: '4px',
  marginBottom: '2px',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
};

const editLinkStyle: React.CSSProperties = {
  color: '#00693f',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '0.88rem',
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

const bulkPanelStyle: React.CSSProperties = {
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '16px',
  backgroundColor: '#eff6ff',
};

const bulkPanelTitleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#1e40af',
  marginBottom: '12px',
  fontSize: '0.95rem',
};

const bulkRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '8px 18px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.88rem',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '36px 16px',
  color: '#888',
  fontSize: '0.95rem',
  fontStyle: 'italic',
};

// Role badge colors
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  dbadmin: { bg: '#fef3c7', color: '#92400e' },
  publisher: { bg: '#ede9fe', color: '#6d28d9' },
  calendar: { bg: '#fce7f3', color: '#9d174d' },
  verifier: { bg: '#d1fae5', color: '#065f46' },
  user: { bg: '#e0f2fe', color: '#0369a1' },
  owner: { bg: '#fef9c3', color: '#854d0e' },
  resident: { bg: '#dcfce7', color: '#166534' },
};

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
    verified: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
    denied: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  };
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    ...(map[status] || { backgroundColor: '#f3f4f6', color: '#374151' }),
  };
}

const ALL_ROLES = ['dbadmin', 'publisher', 'calendar', 'verifier', 'user', 'owner', 'resident'];

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [bulkCommittee, setBulkCommittee] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, committeesRes] = await Promise.all([
        fetch('/api/admin/users?all=true'),
        fetch('/api/committees/visible'),
      ]);

      if (usersRes.status === 401 || usersRes.status === 403) {
        router.push('/');
        return;
      }

      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      if (committeesRes.ok) {
        const committeesData = await committeesRes.json();
        setCommittees(committeesData.committees || []);
      }
    } catch {
      setError('Failed to load users');
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
      if (!session?.user?.roles?.includes('dbadmin')) {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [status, session, router, fetchData]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchesStatus = statusFilter === 'all' || u.verificationStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.unitNumber.toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkAssignRole = async () => {
    if (!bulkRole || selectedIds.size === 0) return;
    if (!confirm(`Assign role "${bulkRole}" to ${selectedIds.size} selected user(s)?`)) return;

    setBulkProcessing(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_role', userIds: Array.from(selectedIds), roleName: bulkRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Bulk role assignment failed');
        return;
      }
      setSuccess(data.message);
      setBulkRole('');
      setSelectedIds(new Set());
      await fetchData();
    } catch {
      setError('Bulk role assignment failed. Please try again.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkAddCommittee = async () => {
    if (!bulkCommittee || selectedIds.size === 0) return;
    const committee = committees.find(c => c.id === bulkCommittee);
    if (!committee) return;
    if (!confirm(`Add ${selectedIds.size} selected user(s) to committee "${committee.name}"?`)) return;

    setBulkProcessing(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_committee', userIds: Array.from(selectedIds), committeeId: bulkCommittee }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Bulk committee assignment failed');
        return;
      }
      setSuccess(data.message);
      setBulkCommittee('');
      setSelectedIds(new Set());
      await fetchData();
    } catch {
      setError('Bulk committee assignment failed. Please try again.');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading users...</p>
      </div>
    );
  }

  const allFilteredSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;

  return (
    <div style={pageStyle}>
      <Link href="/admin/console" style={backLinkStyle}>
        &larr; Back to Admin Console
      </Link>

      <h1 style={headingStyle}>User Management</h1>
      <p style={subheadingStyle}>
        {users.length} total user{users.length !== 1 ? 's' : ''} in the system.
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Filters */}
      <div style={controlRowStyle}>
        <input
          type="text"
          style={searchInputStyle}
          placeholder="Search by name, email, or unit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={selectStyle}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      {/* Bulk Operations Panel */}
      {selectedIds.size > 0 && (
        <div style={bulkPanelStyle}>
          <div style={bulkPanelTitleStyle}>{selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected</div>

          <div style={bulkRowStyle}>
            {/* Bulk Assign Role */}
            <select
              style={selectStyle}
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value)}
              disabled={bulkProcessing}
            >
              <option value="">-- Assign Role --</option>
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              style={{ ...actionButtonStyle, ...((!bulkRole || bulkProcessing) ? disabledButtonStyle : {}) }}
              onClick={handleBulkAssignRole}
              disabled={!bulkRole || bulkProcessing}
            >
              {bulkProcessing ? 'Processing...' : 'Assign Role'}
            </button>

            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>or</span>

            {/* Bulk Add to Committee */}
            <select
              style={selectStyle}
              value={bulkCommittee}
              onChange={e => setBulkCommittee(e.target.value)}
              disabled={bulkProcessing}
            >
              <option value="">-- Add to Committee --</option>
              {committees.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              style={{ ...actionButtonStyle, ...((!bulkCommittee || bulkProcessing) ? disabledButtonStyle : {}) }}
              onClick={handleBulkAddCommittee}
              disabled={!bulkCommittee || bulkProcessing}
            >
              {bulkProcessing ? 'Processing...' : 'Add to Committee'}
            </button>

            <button
              style={{ ...actionButtonStyle, backgroundColor: '#6b7280' }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: '0.88rem', color: '#666', marginBottom: '10px' }}>
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={{ ...thStyle, width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  title="Select all visible"
                />
              </th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Roles</th>
              <th style={thStyle}>Joined</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyStyle}>
                  No users match the current filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr
                  key={user.id}
                  style={{
                    backgroundColor: selectedIds.has(user.id) ? '#f0fdf4' : undefined,
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: '#555' }}>{user.email}</span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' as const }}>
                    <span style={{
                      backgroundColor: '#2d5016',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                    }}>
                      Unit {user.unitNumber}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={getStatusBadgeStyle(user.verificationStatus)}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {user.roles.length === 0 ? (
                        <span style={{ color: '#aaa', fontSize: '0.82rem', fontStyle: 'italic' }}>none</span>
                      ) : (
                        user.roles.map(role => {
                          const colors = ROLE_COLORS[role] || { bg: '#f3f4f6', color: '#374151' };
                          return (
                            <span
                              key={role}
                              style={{ ...roleBadgeStyle, backgroundColor: colors.bg, color: colors.color }}
                            >
                              {role}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' as const, fontSize: '0.82rem', color: '#888' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/admin/console/users/${user.id}`} style={editLinkStyle}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
