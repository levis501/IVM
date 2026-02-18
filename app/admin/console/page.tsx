'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  marginBottom: '32px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '20px',
};

const cardStyle: React.CSSProperties = {
  display: 'block',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '24px 20px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  cursor: 'pointer',
};

const cardIconStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '12px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '6px',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: '#666',
  lineHeight: '1.45',
};

const dividerStyle: React.CSSProperties = {
  borderTop: '2px solid #e5e7eb',
  margin: '32px 0',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 'bold',
  color: '#888',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '14px',
};

interface NavCard {
  href: string;
  icon: string;
  title: string;
  description: string;
}

const CONSOLE_SECTIONS: NavCard[] = [
  {
    href: '/admin/console/users',
    icon: '👥',
    title: 'User Management',
    description: 'View, search, and edit all users. Assign roles and committee memberships.',
  },
  {
    href: '/admin/console/config',
    icon: '⚙️',
    title: 'System Configuration',
    description: 'Manage site-wide settings: session timeout, rate limits, upload limits.',
  },
  {
    href: '/admin/console/templates',
    icon: '✉️',
    title: 'Email Templates',
    description: 'Edit subjects and bodies for all system email notifications.',
  },
  {
    href: '/admin/console/audit-logs',
    icon: '📋',
    title: 'Audit Logs',
    description: 'View, search, filter, and export all audit log entries. Run log retention cleanup.',
  },
];

const OTHER_ADMIN_LINKS: NavCard[] = [
  {
    href: '/admin/verify',
    icon: '✅',
    title: 'Verification Dashboard',
    description: 'Review and approve or deny pending user registrations.',
  },
  {
    href: '/admin/committees',
    icon: '🏛️',
    title: 'Committee Management',
    description: 'Create, edit, and manage community committees.',
  },
];

export default function AdminConsolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (!session?.user?.roles?.includes('dbadmin')) {
        router.push('/');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (status === 'authenticated' && !session?.user?.roles?.includes('dbadmin')) {
    return (
      <div style={pageStyle}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          borderRadius: '8px',
        }}>
          Access denied. This section requires the dbadmin role.
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Database Admin Console</h1>
      <p style={subheadingStyle}>
        Full administrative access: manage users, system configuration, and email templates.
        Logged in as <strong>{session?.user?.email}</strong>.
      </p>

      <div style={sectionLabelStyle}>Console Sections</div>
      <div style={gridStyle}>
        {CONSOLE_SECTIONS.map(card => (
          <Link key={card.href} href={card.href} style={cardStyle}>
            <div style={cardIconStyle}>{card.icon}</div>
            <div style={cardTitleStyle}>{card.title}</div>
            <div style={cardDescStyle}>{card.description}</div>
          </Link>
        ))}
      </div>

      <div style={dividerStyle} />

      <div style={sectionLabelStyle}>Other Admin Areas</div>
      <div style={gridStyle}>
        {OTHER_ADMIN_LINKS.map(card => (
          <Link key={card.href} href={card.href} style={cardStyle}>
            <div style={cardIconStyle}>{card.icon}</div>
            <div style={cardTitleStyle}>{card.title}</div>
            <div style={cardDescStyle}>{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
