'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Styles ---

const pageStyle: React.CSSProperties = {
  maxWidth: '680px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '4px',
};

const breadcrumbStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#666',
  marginBottom: '24px',
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: '#00693f',
  textDecoration: 'none',
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '10px',
  padding: '28px 32px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '6px',
  fontSize: '0.95rem',
};

const requiredStarStyle: React.CSSProperties = {
  color: '#b91c1c',
  marginLeft: '3px',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#111827',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid #ef4444',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '90px',
  fontFamily: 'inherit',
};

const fieldHintStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#6b7280',
  marginTop: '4px',
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#b91c1c',
  marginTop: '4px',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '28px',
};

const cancelLinkStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#e5e7eb',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
  textDecoration: 'none',
  display: 'inline-block',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '10px 28px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const disabledBtnStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const errorBoxStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.9rem',
};

const accessDeniedStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#6b7280',
};

// --- Component ---

export default function NewEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; startAt?: string; endAt?: string }>({});

  const canManageEvents =
    session?.user?.roles?.includes('calendar') ||
    session?.user?.roles?.includes('dbadmin');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/events/new');
    }
  }, [status, router]);

  const validate = (): boolean => {
    const errors: { title?: string; startAt?: string; endAt?: string } = {};

    if (!title.trim()) {
      errors.title = 'Event title is required.';
    }

    if (!startAt) {
      errors.startAt = 'Start date and time are required.';
    }

    if (endAt && startAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (end <= start) {
        errors.endAt = 'End date/time must be after the start date/time.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startAt,
          endAt: endAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create event.');
        return;
      }

      router.push('/events');
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>Create Event</h1>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (!canManageEvents) {
    return (
      <div style={pageStyle}>
        <div style={accessDeniedStyle}>
          <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Access Denied</p>
          <p style={{ fontSize: '0.95rem' }}>
            You need the <strong>calendar</strong> role to create events.
          </p>
          <Link href="/events" style={{ color: '#00693f', fontWeight: 'bold', marginTop: '16px', display: 'inline-block' }}>
            Back to Calendar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Create Event</h1>
      <div style={breadcrumbStyle}>
        <Link href="/events" style={breadcrumbLinkStyle}>Calendar</Link>
        {' / Create Event'}
      </div>

      {submitError && <div style={errorBoxStyle}>{submitError}</div>}

      <div style={formCardStyle}>
        <form onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="title">
              Event Title<span style={requiredStarStyle}>*</span>
            </label>
            <input
              id="title"
              type="text"
              style={fieldErrors.title ? inputErrorStyle : inputStyle}
              value={title}
              onChange={e => { setTitle(e.target.value); setFieldErrors(prev => ({ ...prev, title: undefined })); }}
              placeholder="e.g. Annual Community Pool Party"
              disabled={submitting}
              maxLength={255}
            />
            {fieldErrors.title && <div style={fieldErrorStyle}>{fieldErrors.title}</div>}
          </div>

          {/* Description */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="description">
              Description <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span>
            </label>
            <textarea
              id="description"
              style={textareaStyle}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional details about the event..."
              disabled={submitting}
            />
          </div>

          {/* Start Date/Time */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="startAt">
              Start Date &amp; Time<span style={requiredStarStyle}>*</span>
            </label>
            <input
              id="startAt"
              type="datetime-local"
              style={fieldErrors.startAt ? inputErrorStyle : inputStyle}
              value={startAt}
              onChange={e => { setStartAt(e.target.value); setFieldErrors(prev => ({ ...prev, startAt: undefined })); }}
              disabled={submitting}
            />
            {fieldErrors.startAt && <div style={fieldErrorStyle}>{fieldErrors.startAt}</div>}
          </div>

          {/* End Date/Time */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="endAt">
              End Date &amp; Time <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span>
            </label>
            <input
              id="endAt"
              type="datetime-local"
              style={fieldErrors.endAt ? inputErrorStyle : inputStyle}
              value={endAt}
              onChange={e => { setEndAt(e.target.value); setFieldErrors(prev => ({ ...prev, endAt: undefined })); }}
              disabled={submitting}
            />
            {fieldErrors.endAt && <div style={fieldErrorStyle}>{fieldErrors.endAt}</div>}
            <div style={fieldHintStyle}>Leave blank if the event does not have a fixed end time.</div>
          </div>

          {/* Buttons */}
          <div style={buttonRowStyle}>
            <Link href="/events" style={cancelLinkStyle}>
              Cancel
            </Link>
            <button
              type="submit"
              style={{ ...submitBtnStyle, ...(submitting ? disabledBtnStyle : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
