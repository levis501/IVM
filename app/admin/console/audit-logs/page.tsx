'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const pageStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '8px',
};

const subheadingStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.95rem',
  marginBottom: '24px',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '20px',
  alignItems: 'flex-end',
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 'bold',
  color: '#666',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.9rem',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  minWidth: '160px',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#666',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid #ddd',
  borderRadius: '8px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid #ddd',
  fontWeight: 'bold',
  color: '#333',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
};

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  fontSize: '0.9rem',
  color: '#555',
};

const detailsToggleStyle: React.CSSProperties = {
  color: '#2d5016',
  cursor: 'pointer',
  fontSize: '0.8rem',
  textDecoration: 'underline',
};

const detailsBlockStyle: React.CSSProperties = {
  marginTop: '6px',
  padding: '8px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  fontSize: '0.78rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxWidth: '400px',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    if (status === 'authenticated' && !session?.user?.roles?.includes('dbadmin')) {
      router.push('/');
    }
  }, [status, session, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', '50');
    if (filterAction) params.set('action', filterAction);
    if (filterUserId) params.set('userId', filterUserId);
    if (filterDateFrom) params.set('dateFrom', filterDateFrom);
    if (filterDateTo) params.set('dateTo', filterDateTo);

    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.actions) setActions(data.actions);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterUserId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.roles?.includes('dbadmin')) {
      fetchLogs();
    }
  }, [status, session, fetchLogs]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    params.set('export', 'csv');
    if (filterAction) params.set('action', filterAction);
    if (filterUserId) params.set('userId', filterUserId);
    if (filterDateFrom) params.set('dateFrom', filterDateFrom);
    if (filterDateTo) params.set('dateTo', filterDateTo);
    window.location.href = `/api/admin/audit-logs?${params}`;
  };

  const handleCleanup = async () => {
    if (!confirm('Run log retention cleanup? This will permanently delete old audit log entries per the configured retention policy.')) return;
    try {
      const res = await fetch('/api/admin/audit-logs?action=cleanup', { method: 'POST' });
      const data = await res.json();
      setCleanupResult(`Cleanup complete: ${data.authenticatedDeleted} authenticated + ${data.anonymousDeleted} anonymous entries removed.`);
      fetchLogs();
    } catch (err) {
      console.error('Cleanup failed:', err);
      setCleanupResult('Cleanup failed. Check console for errors.');
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilterAction('');
    setFilterUserId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  if (status === 'loading') {
    return <div style={pageStyle}><p style={{ color: '#666' }}>Loading...</p></div>;
  }

  if (status === 'authenticated' && !session?.user?.roles?.includes('dbadmin')) {
    return (
      <div style={pageStyle}>
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px' }}>
          Access denied. This section requires the dbadmin role.
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/admin/console" style={{ color: '#2d5016', fontSize: '0.9rem' }}>
          &larr; Back to Admin Console
        </Link>
      </div>

      <h1 style={headingStyle}>Audit Logs</h1>
      <p style={subheadingStyle}>
        View and search all audit log entries. Showing {total} total entries.
      </p>

      {/* Filter Bar */}
      <div style={filterBarStyle}>
        <div style={filterGroupStyle}>
          <label style={labelStyle}>Action</label>
          <select
            style={selectStyle}
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          >
            <option value="">All Actions</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div style={filterGroupStyle}>
          <label style={labelStyle}>User ID</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="User UUID..."
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
          />
        </div>
        <div style={filterGroupStyle}>
          <label style={labelStyle}>From</label>
          <input
            style={inputStyle}
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
          />
        </div>
        <div style={filterGroupStyle}>
          <label style={labelStyle}>To</label>
          <input
            style={inputStyle}
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
          />
        </div>
        <button style={buttonStyle} onClick={handleSearch}>Search</button>
        <button style={secondaryButtonStyle} onClick={handleReset}>Reset</button>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={buttonStyle} onClick={handleExportCsv}>Export CSV</button>
          <button style={{ ...secondaryButtonStyle, backgroundColor: '#b91c1c' }} onClick={handleCleanup}>
            Run Cleanup
          </button>
        </div>
        {cleanupResult && (
          <span style={{ fontSize: '0.85rem', color: '#2d5016' }}>{cleanupResult}</span>
        )}
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Actor</th>
              <th style={thStyle}>Entity</th>
              <th style={thStyle}>IP</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>No audit log entries found.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ backgroundColor: log.userId ? 'transparent' : '#fafafa' }}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      backgroundColor: log.action.includes('FAIL') || log.action.includes('DENIED') ? '#fef2f2' :
                        log.action.includes('LOGIN') || log.action.includes('SESSION') ? '#f0fdf4' :
                        '#f0f9ff',
                      color: log.action.includes('FAIL') || log.action.includes('DENIED') ? '#b91c1c' :
                        log.action.includes('LOGIN') || log.action.includes('SESSION') ? '#166534' :
                        '#1e40af',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.83rem' }}>
                    {log.details && typeof log.details === 'object' && 'actor' in log.details
                      ? String(log.details.actor)
                      : log.userId || 'anonymous'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.83rem' }}>
                    {log.entityType && <span>{log.entityType}</span>}
                    {log.entityId && <span style={{ color: '#888', marginLeft: '4px' }}>({log.entityId.substring(0, 8)}...)</span>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#888' }}>
                    {log.ipAddress || '-'}
                  </td>
                  <td style={tdStyle}>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <>
                        <span
                          style={detailsToggleStyle}
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          {expandedLog === log.id ? 'Hide' : 'View'}
                        </span>
                        {expandedLog === log.id && (
                          <div style={detailsBlockStyle}>
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={paginationStyle}>
        <span>
          Page {page} of {totalPages} ({total} total entries)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{ ...buttonStyle, opacity: page <= 1 ? 0.5 : 1 }}
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            style={{ ...buttonStyle, opacity: page >= totalPages ? 0.5 : 1 }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
