'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isNumeric: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '820px',
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '0.93rem',
};

const tableWrapperStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '24px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left' as const,
  fontWeight: 'bold',
  color: '#444',
  backgroundColor: '#f3f4f6',
  borderBottom: '2px solid #ddd',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top' as const,
};

const keyStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  backgroundColor: '#f3f4f6',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '0.88rem',
  color: '#2d5016',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid #f87171',
  backgroundColor: '#fff5f5',
};

const helperTextStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#888',
  marginTop: '3px',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '4px',
};

const saveAllButtonStyle: React.CSSProperties = {
  padding: '10px 28px',
  backgroundColor: '#00693f',
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

export default function AdminConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      const cfgs: ConfigEntry[] = data.configs || [];
      setConfigs(cfgs);
      const initialValues: Record<string, string> = {};
      cfgs.forEach(c => { initialValues[c.key] = c.value; });
      setValues(initialValues);
    } catch {
      setError('Failed to load configuration');
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
      fetchConfigs();
    }
  }, [status, session, router, fetchConfigs]);

  const handleValueChange = (key: string, value: string, isNumeric: boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));

    // Real-time validation for numeric fields
    if (isNumeric) {
      if (value.trim() === '') {
        setValidationErrors(prev => ({ ...prev, [key]: 'Value cannot be empty' }));
      } else {
        const num = Number(value);
        if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
          setValidationErrors(prev => ({ ...prev, [key]: 'Must be a positive whole number' }));
        } else {
          setValidationErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      }
    } else if (value.trim() === '') {
      setValidationErrors(prev => ({ ...prev, [key]: 'Value cannot be empty' }));
    } else {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSaveAll = async () => {
    // Final validation
    const errors: Record<string, string> = {};
    for (const cfg of configs) {
      const val = values[cfg.key] ?? '';
      if (val.trim() === '') {
        errors[cfg.key] = 'Value cannot be empty';
        continue;
      }
      if (cfg.isNumeric) {
        const num = Number(val);
        if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
          errors[cfg.key] = 'Must be a positive whole number';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const updates = configs.map(c => ({ key: c.key, value: values[c.key] ?? c.value }));

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save configuration');
        return;
      }
      setSuccess('Configuration saved successfully!');
      await fetchConfigs();
    } catch {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading configuration...</p>
      </div>
    );
  }

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div style={pageStyle}>
      <Link href="/admin/console" style={backLinkStyle}>
        &larr; Back to Admin Console
      </Link>

      <h1 style={headingStyle}>System Configuration</h1>
      <p style={subheadingStyle}>
        Edit site-wide settings. All changes are saved together and logged to the audit trail.
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '30%' }}>Key</th>
              <th style={{ ...thStyle, width: '25%' }}>Value</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, width: '14%', fontSize: '0.8rem' }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {configs.map(cfg => {
              const val = values[cfg.key] ?? cfg.value;
              const fieldError = validationErrors[cfg.key];
              return (
                <tr key={cfg.key}>
                  <td style={tdStyle}>
                    <span style={keyStyle}>{cfg.key}</span>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type={cfg.isNumeric ? 'number' : 'text'}
                      style={fieldError ? inputErrorStyle : inputStyle}
                      value={val}
                      onChange={e => handleValueChange(cfg.key, e.target.value, cfg.isNumeric)}
                      disabled={saving}
                      min={cfg.isNumeric ? 1 : undefined}
                      step={cfg.isNumeric ? 1 : undefined}
                    />
                    {fieldError && (
                      <div style={{ ...helperTextStyle, color: '#b91c1c' }}>{fieldError}</div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {cfg.description ? (
                      <span style={{ color: '#555', fontSize: '0.88rem' }}>{cfg.description}</span>
                    ) : (
                      <span style={{ color: '#bbb', fontSize: '0.82rem', fontStyle: 'italic' }}>No description</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#aaa', whiteSpace: 'nowrap' as const }}>
                    {new Date(cfg.updatedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={buttonRowStyle}>
        <button
          style={{ ...saveAllButtonStyle, ...((saving || hasErrors) ? disabledButtonStyle : {}) }}
          onClick={handleSaveAll}
          disabled={saving || hasErrors}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
        <button
          style={{
            padding: '10px 20px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: '#555',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem',
          }}
          onClick={() => {
            const initialValues: Record<string, string> = {};
            configs.forEach(c => { initialValues[c.key] = c.value; });
            setValues(initialValues);
            setValidationErrors({});
            setError('');
            setSuccess('');
          }}
          disabled={saving}
        >
          Reset Changes
        </button>
      </div>
    </div>
  );
}
