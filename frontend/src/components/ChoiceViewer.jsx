import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

export function ChoiceViewer({
  options = [],
  optionCounts = {},
  totalVotes = 0,
  isVoting = false,
  selectedOptions = [],
  onSelectOption,
  showPercentages = true,
}) {
  // Hide percentages from voters as requested ("not show percentage for voters")
  const displayPercentages = showPercentages && !isVoting;

  // Find highest vote count
  let maxVotes = 0;
  options.forEach((opt) => {
    const count = optionCounts[opt.id] || 0;
    if (count > maxVotes) maxVotes = count;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {options.map((opt, idx) => {
        const count = optionCounts[opt.id] || 0;
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = selectedOptions.includes(opt.id);
        const isLeader = maxVotes > 0 && count === maxVotes;
        const barColor = opt.color || '#00a6f4';

        return (
          <div
            key={opt.id}
            onClick={() => isVoting && onSelectOption && onSelectOption(opt.id)}
            style={{
              position: 'relative',
              background: isSelected ? 'var(--cyan-soft)' : 'var(--bg-main)',
              border: isSelected
                ? '2px solid var(--primary)'
                : '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px 20px',
              cursor: isVoting ? 'pointer' : 'default',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
              boxShadow: isSelected ? '0 0 16px rgba(0, 166, 244, 0.25)' : 'none',
            }}
          >
            {/* Animated Background Progress Fill (Only shown when displayPercentages is true) */}
            {displayPercentages && (
              <div
                className="progress-fill"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, ${barColor}15 0%, ${barColor}35 100%)`,
                  borderRight: percent > 0 ? `3px solid ${barColor}` : 'none',
                  zIndex: 1,
                  transition: 'width 0.4s ease',
                }}
              />
            )}

            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isVoting ? (
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isSelected ? `6px solid var(--primary)` : '2px solid var(--border-subtle)',
                      background: isSelected ? '#ffffff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--primary)' : 'var(--cyan-soft)',
                      color: isSelected ? '#ffffff' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                )}

                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {opt.text}
                    </span>
                    {displayPercentages && isLeader && totalVotes > 1 && (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', fontSize: '10px' }}>
                        <Award size={12} /> LEADER
                      </span>
                    )}
                    {isSelected && (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Your Choice
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vote Count and Percentage - ONLY displayed when displayPercentages is true (Presenter / Creator screen) */}
              {displayPercentages && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {count} {count === 1 ? 'vote' : 'votes'}
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: isLeader ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      minWidth: '50px',
                      textAlign: 'right',
                    }}
                  >
                    {percent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
