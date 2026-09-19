import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SyncPollLogo } from './SyncPollLogo';
import {
  GraduationCap,
  MapPin,
  Heart,
  Code2,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';

export function Footer() {
  const location = useLocation();

  // On presenter mode, keep the presentation view distraction-free
  if (location.pathname.startsWith('/present/')) {
    return null;
  }

  return (
    <footer
      style={{
        marginTop: '60px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
        padding: '48px 24px 28px',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        {/* Top Grid: Brand & Developer Profile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Column 1: SyncPoll Platform Info */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <SyncPollLogo size={32} showText={true} />
            </div>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '380px',
                marginBottom: '16px',
              }}
            >
              Ultra-low-latency real-time audience polling, head-to-head clash battles, and consensus visualization engine powered by Go and WebSockets.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan-soft-border)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Code2 size={12} /> Go Backend
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan-soft-border)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={12} /> React + Vite
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#ec4899',
                  background: 'var(--pink-soft)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Sub-ms Sync
              </span>
            </div>
          </div>

          {/* Column 2: Creator & Academic Card (MR KUGAN - MCA SRM KATTANKULATHUR) */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '22px 26px',
              textAlign: 'left',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={13} /> Project Architect & Developer
              </span>
              <a
                href="https://github.com/mrkugan54/SYNCPOLL"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  background: 'var(--bg-card)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
                <ExternalLink size={11} color="var(--text-muted)" />
              </a>
            </div>

            {/* Name */}
            <h3
              style={{
                fontSize: '22px',
                fontWeight: '900',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
              }}
            >
              MR. KUGAN
            </h3>

            {/* Degree & Department */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              <GraduationCap size={17} color="var(--primary)" />
              <span>MCA — Master of Computer Applications</span>
            </div>

            {/* College & Campus */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '14px',
              }}
            >
              <MapPin size={16} color="#ef4444" />
              <span>SRM Institute of Science and Technology, Kattankulathur</span>
            </div>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                margin: 0,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '10px',
              }}
            >
              Full-stack real-time consensus platform engineering for live audiences, classrooms, and enterprise keynote sessions.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>© {new Date().getFullYear()} <strong>SyncPoll</strong>.</span>
            <span>Crafted with</span>
            <Heart size={14} color="#ef4444" fill="#ef4444" style={{ display: 'inline' }} />
            <span>by <strong>Mr. Kugan</strong> (MCA, SRM Kattankulathur).</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: '13px',
              }}
            >
              Home
            </Link>
            <Link
              to="/create"
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: '13px',
              }}
            >
              Create Poll
            </Link>
            <a
              href="https://github.com/mrkugan54/SYNCPOLL"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'var(--primary)',
                fontWeight: '700',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>mrkugan54/SYNCPOLL</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
