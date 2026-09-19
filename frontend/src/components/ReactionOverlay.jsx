import React, { useState, useEffect } from 'react';

export function ReactionOverlay({ floatingReactions = [], onSendReaction, showButtons = true }) {
  const emojis = ['🔥', '👏', '💡', '🚀', '❤️', '🤯'];

  return (
    <>
      {/* Floating Emojis Layer */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            className="floating-emoji"
            style={{
              left: `${item.x}%`,
              fontSize: `${item.size || 32}px`,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Interactive Reaction Toolbar (for voters or presenter) */}
      {showButtons && (
        <div className="glass-panel" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: '600' }}>React:</span>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction && onSendReaction(emoji)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.25)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
