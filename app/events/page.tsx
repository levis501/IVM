'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
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
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#666',
  marginBottom: '24px',
  fontSize: '0.95rem',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const eventTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '6px',
};

const eventDateStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#2d5016',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const eventDescStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#555',
  lineHeight: '1.5',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#666',
  fontSize: '1.1rem',
};

const infoBoxStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.9rem',
};

function formatEventDate(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  let result = start.toLocaleDateString('en-US', options);

  if (endAt) {
    const end = new Date(endAt);
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      result += ` - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      result += ` - ${end.toLocaleDateString('en-US', options)}`;
    }
  }

  return result;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.events) {
          setEvents(data.events);
          setIsVerified(data.isVerified);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status !== 'loading') {
      fetchEvents();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>Community Events</h1>
        <p style={{ color: '#666' }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Community Events</h1>
      <p style={subtitleStyle}>
        {isVerified
          ? 'All community events, past and upcoming.'
          : 'Upcoming community events. Sign in to view past events.'}
      </p>

      {!session && (
        <div style={infoBoxStyle}>
          Past events are only visible to verified community members.
          Please sign in to view the full event history.
        </div>
      )}

      {events.length === 0 ? (
        <div style={emptyStyle}>
          <p>No events to display at this time.</p>
        </div>
      ) : (
        <div>
          {events.map(event => (
            <div key={event.id} style={cardStyle}>
              <div style={eventTitleStyle}>{event.title}</div>
              <div style={eventDateStyle}>
                {formatEventDate(event.startAt, event.endAt)}
              </div>
              {event.description && (
                <div style={eventDescStyle}>{event.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
