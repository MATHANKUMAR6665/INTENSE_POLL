import React from 'react';

export function SyncPollLogo({ size = 36, showText = true, textColor = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bar 1 */}
          <rect x="2" y="10" width="3.5" height="10" rx="1.75" fill="#ffffff" />
          {/* Bar 2 */}
          <rect x="7.5" y="4" width="3.5" height="16" rx="1.75" fill="#ffffff" />
          {/* Bar 3 */}
          <rect x="13" y="7" width="3.5" height="13" rx="1.75" fill="#ffffff" />
          {/* Bar 4 */}
          <rect x="18.5" y="11" width="3.5" height="9" rx="1.75" fill="#ffffff" />
        </svg>
      </div>
      {showText && (
        <span
          style={{
            fontSize: `${Math.round(size * 0.58)}px`,
            fontWeight: '800',
            letterSpacing: '-0.5px',
            color: textColor,
            fontFamily: 'var(--font-sans)',
          }}
        >
          SyncPoll
        </span>
      )}
    </div>
  );
}
