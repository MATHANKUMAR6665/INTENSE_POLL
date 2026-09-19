import React from 'react';
import { Swords } from 'lucide-react';

export function ClashViewer({
  options = [],
  optionCounts = {},
  totalVotes = 0,
  isVoting = false,
  selectedOption = null,
  onSelectOption,
  showPercentages = true,
}) {
  if (options.length < 2) return null;

  const displayPercentages = showPercentages && !isVoting;

  const optA = options[0];
  const optB = options[1];

  const countA = optionCounts[optA.id] || 0;
  const countB = optionCounts[optB.id] || 0;

  const percentA = totalVotes > 0 ? Math.round((countA / totalVotes) * 100) : 50;
  const percentB = 100 - percentA;

  return (
    <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
      {/* Clash Header / Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
        {/* Left Option */}
        <div
          onClick={() => isVoting && onSelectOption && onSelectOption(optA.id)}
          style={{
            flex: 1,
            textAlign: 'left',
            padding: '16px 20px',
            borderRadius: '16px',
            background: selectedOption === optA.id ? 'var(--cyan-soft)' : 'var(--bg-main)',
            border: selectedOption === optA.id ? '2.5px solid var(--primary)' : '1px solid var(--border-subtle)',
            cursor: isVoting ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            boxShadow: selectedOption === optA.id ? '0 0 20px rgba(0, 166, 244, 0.3)' : 'none',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Team A
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0' }}>
            {optA.text}
          </div>
          {displayPercentages && (
            <>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {percentA}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{countA} votes</div>
            </>
          )}
          {selectedOption === optA.id && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>
              ✓ {isVoting ? 'Selected' : 'Your Choice'}
            </div>
          )}
        </div>

        {/* Center VS Badge */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-card)',
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <Swords size={18} />
        </div>

        {/* Right Option */}
        <div
          onClick={() => isVoting && onSelectOption && onSelectOption(optB.id)}
          style={{
            flex: 1,
            textAlign: 'right',
            padding: '16px 20px',
            borderRadius: '16px',
            background: selectedOption === optB.id ? 'var(--pink-soft)' : 'var(--bg-main)',
            border: selectedOption === optB.id ? '2.5px solid #ec4899' : '1px solid var(--border-subtle)',
            cursor: isVoting ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            boxShadow: selectedOption === optB.id ? '0 0 20px rgba(236, 72, 153, 0.3)' : 'none',
          }}
        >
          <div style={{ fontSize: '12px', color: '#ec4899', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Team B
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0' }}>
            {optB.text}
          </div>
          {displayPercentages && (
            <>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#ec4899', fontFamily: 'var(--font-mono)' }}>
                {percentB}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{countB} votes</div>
            </>
          )}
          {selectedOption === optB.id && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#ec4899', fontWeight: '700' }}>
              ✓ {isVoting ? 'Selected' : 'Your Choice'}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Tug-of-War Split Bar - Only shown when displayPercentages is true */}
      {displayPercentages && (
        <div
          style={{
            position: 'relative',
            height: '24px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Left Side (Option A) */}
          <div
            className="progress-fill"
            style={{
              width: `${percentA}%`,
              background: 'linear-gradient(90deg, #00b4d8 0%, #00a6f4 100%)',
            }}
          />

          {/* Right Side (Option B) */}
          <div
            className="progress-fill"
            style={{
              width: `${percentB}%`,
              background: 'linear-gradient(90deg, #f43f5e 0%, #ec4899 100%)',
            }}
          />

          {/* Middle Clash Marker */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${percentA}%`,
              width: '4px',
              background: '#ffffff',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px #ffffff',
              zIndex: 5,
            }}
          />
        </div>
      )}

      {isVoting && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
          Tap Team A or Team B above to choose your fighter!
        </p>
      )}
    </div>
  );
}
