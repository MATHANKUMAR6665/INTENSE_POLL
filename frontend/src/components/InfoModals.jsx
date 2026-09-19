import React from 'react';
import { X, Check, Zap, Sparkles, Shield, Cpu, Activity, Globe, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InfoModal({ activeModal, onClose }) {
  if (!activeModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            {activeModal === 'features' && 'Platform Capabilities'}
            {activeModal === 'usecases' && 'Popular Use Cases'}
            {activeModal === 'pricing' && 'Transparent Pricing'}
            {activeModal === 'docs' && 'Architecture & Documentation'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '6px',
              borderRadius: '50%',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px', maxHeight: '70vh', overflowY: 'auto' }}>
          {activeModal === 'features' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 166, 244, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={20} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Sub-millisecond Polling</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Redis Pub/Sub atomic counter pipelines deliver instant feedback updates across thousands of connected clients without page reloads.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={20} color="#ec4899" />
                </div>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Tug-of-War Realtime Clashes</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Head-to-head 1v1 debate showdowns featuring dynamic crowd momentum physics and live visual feedback.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={20} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Floating Real-time Emoji Streams</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Audience members can fire emoji reactions (❤️, 🔥, 👏, 🎉) that float dynamically across presenter and voter screens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeModal === 'usecases' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)', marginBottom: '6px' }}>🎓 Interactive Classrooms</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Check comprehension instantly with 6-digit PIN entry and live leaderboard breakdowns.
                </p>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)', marginBottom: '6px' }}>🎤 Keynotes & Summits</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Scale to thousands of simultaneous attendees without latency spikes or server bottlenecks.
                </p>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)', marginBottom: '6px' }}>💼 All-Hands & Standups</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Drive rapid team consensus, vote on sprint priorities, and break debate deadlocks with Tug-of-War.
                </p>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)', marginBottom: '6px' }}>🎮 Live Streams & Events</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Engage Twitch/YouTube live streams with reactive voting widgets and floating emoji showers.
                </p>
              </div>
            </div>
          )}

          {activeModal === 'pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'rgba(0, 166, 244, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '18px' }}>Free & Open Tier</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>$0 / forever</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Complete production-grade polling with no user caps, unlimited polls, and real-time Go backend.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--primary)" /> <span>Unlimited live choice polls & Tug-of-War clashes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--primary)" /> <span>High-speed Redis atomic tallies</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--primary)" /> <span>Instant 6-digit PIN participant access</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModal === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: 1.6 }}>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>🚀 High-Performance Architecture</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Built with Go Gin for concurrency, Redis for in-memory atomicity and WebSockets / SSE broadcasts, MongoDB for durable poll records, and React 19 for fluid client interaction.
                </p>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>⚡ 6-Digit PIN Routing</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Participants enter a 6-digit code to connect instantly to the designated poll stream without creating accounts.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Close
          </button>
          <Link
            to="/login?tab=register"
            onClick={onClose}
            className="btn-pill-primary"
            style={{ textDecoration: 'none', fontSize: '14px', padding: '8px 20px' }}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
