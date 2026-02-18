'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body: string;
  variables: string[];
  updatedBy: string | null;
  updatedAt: string;
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '900px',
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

const templateCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  marginBottom: '16px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  overflow: 'hidden',
};

const templateHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  userSelect: 'none' as const,
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #eee',
};

const templateHeaderExpandedStyle: React.CSSProperties = {
  ...templateHeaderStyle,
  backgroundColor: '#f0fdf4',
  borderBottom: '1px solid #86efac',
};

const templateKeyStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  marginRight: '10px',
};

const templateBodyStyle: React.CSSProperties = {
  padding: '18px 20px',
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
  fontSize: '0.93rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '220px',
  resize: 'vertical' as const,
  lineHeight: '1.5',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const charCountStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#999',
  marginTop: '3px',
  textAlign: 'right' as const,
};

const variablesContainerStyle: React.CSSProperties = {
  marginBottom: '16px',
  padding: '10px 14px',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
};

const variablesTitleStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 'bold',
  color: '#92400e',
  marginBottom: '6px',
};

const variableChipStyle: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: 'monospace',
  backgroundColor: '#fef3c7',
  color: '#78350f',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  marginRight: '6px',
  marginBottom: '4px',
  border: '1px solid #fde68a',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  marginTop: '4px',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '9px 22px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const saveSuccessStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: '#166534',
  fontWeight: '500',
};

const saveErrorStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: '#b91c1c',
  fontWeight: '500',
};

const errorStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const chevronStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#888',
  transition: 'transform 0.15s ease',
};

// Per-template editing state
interface TemplateEditState {
  subject: string;
  body: string;
  saving: boolean;
  success: string;
  error: string;
}

export default function AdminTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, TemplateEditState>>({});

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      const tmpl: EmailTemplate[] = data.templates || [];
      setTemplates(tmpl);

      // Initialize edit states
      const states: Record<string, TemplateEditState> = {};
      tmpl.forEach(t => {
        states[t.id] = { subject: t.subject, body: t.body, saving: false, success: '', error: '' };
      });
      setEditStates(states);
    } catch {
      setGlobalError('Failed to load email templates');
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
      fetchTemplates();
    }
  }, [status, session, router, fetchTemplates]);

  const updateEditState = (id: string, partial: Partial<TemplateEditState>) => {
    setEditStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...partial },
    }));
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    const state = editStates[template.id];
    if (!state) return;

    if (!state.subject.trim()) {
      updateEditState(template.id, { error: 'Subject is required', success: '' });
      return;
    }
    if (!state.body.trim()) {
      updateEditState(template.id, { error: 'Body is required', success: '' });
      return;
    }

    updateEditState(template.id, { saving: true, error: '', success: '' });

    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: state.subject, body: state.body }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateEditState(template.id, { saving: false, error: data.error || 'Save failed' });
        return;
      }
      updateEditState(template.id, { saving: false, success: 'Saved successfully!' });
      // Update the template in list to reflect saved state
      setTemplates(prev => prev.map(t =>
        t.id === template.id ? { ...t, subject: state.subject, body: state.body } : t
      ));
    } catch {
      updateEditState(template.id, { saving: false, error: 'Save failed. Please try again.' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading templates...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link href="/admin/console" style={backLinkStyle}>
        &larr; Back to Admin Console
      </Link>

      <h1 style={headingStyle}>Email Template Management</h1>
      <p style={subheadingStyle}>
        Edit subjects and body text for all system email notifications.
        Use {'{{'} variable {'}} '}syntax to insert dynamic values.
      </p>

      {globalError && <div style={errorStyle}>{globalError}</div>}

      {templates.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>No email templates found.</p>
      ) : (
        templates.map(template => {
          const state = editStates[template.id];
          const isExpanded = expandedId === template.id;
          if (!state) return null;

          return (
            <div key={template.id} style={templateCardStyle}>
              {/* Header / toggle */}
              <div
                style={isExpanded ? templateHeaderExpandedStyle : templateHeaderStyle}
                onClick={() => setExpandedId(isExpanded ? null : template.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : template.id); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={templateKeyStyle}>{template.key}</span>
                  <span style={{ color: '#444', fontSize: '0.93rem', fontWeight: '500' }}>
                    {state.subject || template.subject}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>
                    Updated {new Date(template.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ ...chevronStyle, transform: isExpanded ? 'rotate(180deg)' : undefined }}>
                    &#9660;
                  </span>
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div style={templateBodyStyle}>
                  {/* Variables reference */}
                  {template.variables.length > 0 && (
                    <div style={variablesContainerStyle}>
                      <div style={variablesTitleStyle}>Available Template Variables:</div>
                      <div>
                        {template.variables.map(v => (
                          <span key={v} style={variableChipStyle}>{`{{${v}}}`}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle} htmlFor={`subject-${template.id}`}>
                      Subject <span style={{ color: '#b91c1c' }}>*</span>
                    </label>
                    <input
                      id={`subject-${template.id}`}
                      type="text"
                      style={inputStyle}
                      value={state.subject}
                      onChange={e => updateEditState(template.id, { subject: e.target.value, success: '', error: '' })}
                      disabled={state.saving}
                      maxLength={200}
                    />
                  </div>

                  {/* Body */}
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle} htmlFor={`body-${template.id}`}>
                      Body <span style={{ color: '#b91c1c' }}>*</span>
                    </label>
                    <textarea
                      id={`body-${template.id}`}
                      style={textareaStyle}
                      value={state.body}
                      onChange={e => updateEditState(template.id, { body: e.target.value, success: '', error: '' })}
                      disabled={state.saving}
                    />
                    <div style={charCountStyle}>{state.body.length.toLocaleString()} characters</div>
                  </div>

                  {/* Save row */}
                  <div style={buttonRowStyle}>
                    <button
                      style={{ ...saveButtonStyle, ...(state.saving ? disabledButtonStyle : {}) }}
                      onClick={() => handleSaveTemplate(template)}
                      disabled={state.saving}
                    >
                      {state.saving ? 'Saving...' : 'Save Template'}
                    </button>
                    {state.success && <span style={saveSuccessStyle}>{state.success}</span>}
                    {state.error && <span style={saveErrorStyle}>{state.error}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
