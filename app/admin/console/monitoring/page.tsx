'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Metrics {
  pendingVerifications: number;
  totalUsers: number;
  verifiedUsers: number;
  deniedUsers: number;
  recentFailedLogins: number;
  recentAuditEvents: number;
  documentsOnDisk: number;
  diskUsage: {
    documentsFormatted: string;
    logsFormatted: string;
  };
  systemLoad: number[];
  memoryUsage: {
    totalMB: number;
    freeMB: number;
    usedPercent: number;
  };
  uptime: string;
}

const pageStyle: React.CSSProperties = {
  maxWidth: '960px',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '28px',
};

const metricCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '18px 16px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '4px',
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '2px solid #e5e7eb',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  marginRight: '10px',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#6b7280',
};

const alertBoxStyle: React.CSSProperties = {
  padding: '14px 18px',
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: '8px',
  marginBottom: '16px',
  fontSize: '0.9rem',
};

const successBoxStyle: React.CSSProperties = {
  padding: '14px 18px',
  backgroundColor: '#d1fae5',
  border: '1px solid #6ee7b7',
  borderRadius: '8px',
  marginBottom: '16px',
  fontSize: '0.9rem',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '20px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
};

export default function MonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertResult, setAlertResult] = useState<string[] | null>(null);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/monitoring');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
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
      fetchMetrics();
    }
  }, [status, session, router, fetchMetrics]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleCheckAlerts = async () => {
    setCheckingAlerts(true);
    setAlertResult(null);
    try {
      const res = await fetch('/api/admin/monitoring', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAlertResult(data.alertsSent);
      }
    } catch (error) {
      console.error('Failed to check alerts:', error);
    } finally {
      setCheckingAlerts(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading monitoring data...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#b91c1c' }}>Failed to load monitoring data.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link href="/admin/console" style={backLinkStyle}>
        &larr; Back to Admin Console
      </Link>

      <h1 style={headingStyle}>System Monitoring</h1>
      <p style={subheadingStyle}>
        Real-time system health and metrics.
        {lastRefresh && (
          <span style={{ marginLeft: '12px', color: '#888', fontSize: '0.85rem' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </p>

      {/* Alert result */}
      {alertResult !== null && (
        alertResult.length > 0 ? (
          <div style={alertBoxStyle}>
            <strong>Alerts triggered:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              {alertResult.map((alert, i) => <li key={i}>{alert}</li>)}
            </ul>
          </div>
        ) : (
          <div style={successBoxStyle}>
            All checks passed. No alerts needed.
          </div>
        )
      )}

      {/* User Metrics */}
      <div style={sectionTitleStyle}>User Statistics</div>
      <div style={gridStyle}>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.totalUsers}</div>
          <div style={metricLabelStyle}>Total Users</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.verifiedUsers}</div>
          <div style={metricLabelStyle}>Verified Users</div>
        </div>
        <div style={{
          ...metricCardStyle,
          borderColor: metrics.pendingVerifications > 0 ? '#fcd34d' : '#e5e7eb',
        }}>
          <div style={{
            ...metricValueStyle,
            color: metrics.pendingVerifications > 0 ? '#d97706' : '#2d5016',
          }}>
            {metrics.pendingVerifications}
          </div>
          <div style={metricLabelStyle}>Pending Verifications</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.deniedUsers}</div>
          <div style={metricLabelStyle}>Denied Users</div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div style={sectionTitleStyle}>Activity (Last 24 Hours)</div>
      <div style={gridStyle}>
        <div style={{
          ...metricCardStyle,
          borderColor: metrics.recentFailedLogins > 3 ? '#fca5a5' : '#e5e7eb',
        }}>
          <div style={{
            ...metricValueStyle,
            color: metrics.recentFailedLogins > 3 ? '#dc2626' : '#2d5016',
          }}>
            {metrics.recentFailedLogins}
          </div>
          <div style={metricLabelStyle}>Failed Login Attempts</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.recentAuditEvents}</div>
          <div style={metricLabelStyle}>Audit Events</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.documentsOnDisk}</div>
          <div style={metricLabelStyle}>Documents</div>
        </div>
      </div>

      {/* Storage */}
      <div style={sectionTitleStyle}>Storage</div>
      <div style={gridStyle}>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.diskUsage.documentsFormatted}</div>
          <div style={metricLabelStyle}>Documents Storage</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.diskUsage.logsFormatted}</div>
          <div style={metricLabelStyle}>Log Storage</div>
        </div>
      </div>

      {/* System Health */}
      <div style={sectionTitleStyle}>System Health</div>
      <div style={gridStyle}>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.memoryUsage.usedPercent}%</div>
          <div style={metricLabelStyle}>Memory Used ({metrics.memoryUsage.freeMB} MB free)</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.systemLoad[0]?.toFixed(2)}</div>
          <div style={metricLabelStyle}>Load Average (1 min)</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricValueStyle}>{metrics.uptime}</div>
          <div style={metricLabelStyle}>System Uptime</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button style={buttonStyle} onClick={fetchMetrics}>
          Refresh Metrics
        </button>
        <button
          style={secondaryButtonStyle}
          onClick={handleCheckAlerts}
          disabled={checkingAlerts}
        >
          {checkingAlerts ? 'Checking...' : 'Run Alert Checks'}
        </button>
      </div>
    </div>
  );
}
