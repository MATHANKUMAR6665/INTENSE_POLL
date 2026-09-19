import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePollSocket } from '../hooks/usePollSocket';
import { QRModal } from '../components/QRModal';
import {
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  BarChart2,
  Swords,
  Trophy,
  Plus,
  Radio,
  CheckCircle2,
  Tv,
  QrCode,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Logged-in Creator's Real Poll Data
  const [userPolls, setUserPolls] = useState([]);
  const [userPollsLoading, setUserPollsLoading] = useState(false);
  const [selectedUserPollId, setSelectedUserPollId] = useState(null);
  const [activePollData, setActivePollData] = useState(null);
  const [activePollState, setActivePollState] = useState(null);
  const [qrModalPoll, setQrModalPoll] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load user's real polls when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;

    const loadUserPolls = async () => {
      setUserPollsLoading(true);
      try {
        const res = await api.listPolls();
        const polls = Array.isArray(res) ? res : (res?.polls || []);
        if (!isCancelled) {
          setUserPolls(polls);
          if (polls.length > 0) {
            const live = polls.find((p) => p.is_active) || polls[0];
            setSelectedUserPollId(live.id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch creator polls for homepage:', err);
      } finally {
        if (!isCancelled) setUserPollsLoading(false);
      }
    };

    loadUserPolls();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // Load full poll details and live state when active poll changes
  useEffect(() => {
    if (!selectedUserPollId) return;
    let isCancelled = false;

    const loadPollDetails = async () => {
      try {
        const res = await api.getPoll(selectedUserPollId);
        if (!isCancelled && res?.poll) {
          setActivePollData(res.poll);
          setActivePollState(res.live_state);
        }
      } catch (err) {
        console.warn('Failed to load poll details:', err);
      }
    };

    loadPollDetails();
    return () => {
      isCancelled = true;
    };
  }, [selectedUserPollId]);

  // Live WebSocket sync for the creator's real poll
  const handleIncomingVote = useCallback((payload) => {
    setActivePollState((prev) => {
      const voterName = payload.voter_name;
      const prevRecent = prev?.recent_voters || [];
      const updatedRecent = voterName
        ? [voterName, ...prevRecent.filter((n, idx) => idx < 9 && n !== voterName)]
        : prevRecent;

      if (!prev) return { ...payload, recent_voters: updatedRecent };
      return {
        ...prev,
        total_votes: payload.total_votes,
        option_counts: payload.option_counts || prev.option_counts,
        recent_voters: updatedRecent,
      };
    });
  }, []);

  usePollSocket(
    isAuthenticated && selectedUserPollId ? selectedUserPollId : null,
    null,
    handleIncomingVote
  );



  // Auto-advance and handle typing in 6-digit PIN boxes
  const handleDigitChange = (index, value) => {
    // Only accept single alphanumeric character
    const cleaned = value.slice(-1).toUpperCase();
    const newDigits = [...pinDigits];
    newDigits[index] = cleaned;
    setPinDigits(newDigits);
    setError('');

    // If character entered, auto-focus next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < 6 && i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);

    // Focus last filled or next empty
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleJoinByPin = async (e) => {
    if (e) e.preventDefault();
    const pin = pinDigits.join('').trim();
    if (pin.length < 6) {
      setError('Please enter all 6 digits of the poll PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.getPoll(pin);
      if (res && res.poll) {
        navigate(`/vote/${res.poll.id}`);
      } else {
        setError('Poll not found. Please check the 6-digit PIN.');
      }
    } catch (err) {
      setError(err.message || 'Poll not found with this PIN');
    } finally {
      setLoading(false);
    }
  };

  const livePollOptions = activePollData?.options || [];
  const liveTotalVotes = activePollState?.total_votes ?? activePollData?.total_votes ?? 0;
  const liveOptionCounts = activePollState?.option_counts || {};
  const liveRecentVoters = activePollState?.recent_voters || [];

  return (
    <div style={{ minHeight: '100vh', background: '#dff4fb', paddingBottom: '28px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            padding: '18px 0 14px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #15803d, #22c55e)',
                  position: 'relative',
                  boxShadow: '0 8px 18px rgba(34, 197, 94, 0.25)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '7px',
                    right: '7px',
                    bottom: '7px',
                    height: '14px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.18)',
                    transform: 'skewY(-18deg)',
                  }}
                />
              </div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>SyncPoll</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                style={{
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(14, 165, 233, 0.38)',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.35)',
                    border: '1px solid rgba(14, 165, 233, 0.38)',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '15px',
                    padding: '10px 22px',
                    borderRadius: '12px',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    boxShadow: '0 12px 24px rgba(34, 197, 94, 0.32)',
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </header>

        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '32px',
            alignItems: 'start',
            paddingTop: '30px',
            marginBottom: '34px',
          }}
        >
          <section style={{ padding: '18px 0 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.38)',
                border: '1px solid rgba(14, 165, 233, 0.15)',
                borderRadius: '9999px',
                padding: '8px 16px',
                marginBottom: '18px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              <span style={{ fontSize: '15px' }}>⚡</span>
              <span style={{ fontSize: '14px' }}>Realtime audience polling</span>
            </div>

            <h1
              style={{
                fontSize: '78px',
                lineHeight: 0.94,
                letterSpacing: '-2.4px',
                fontWeight: 900,
                color: '#0f172a',
                maxWidth: '620px',
                marginBottom: '18px',
              }}
            >
              Host live polls<br />
              <span style={{ color: '#22c55e' }}>without the noise</span>
            </h1>

            <p
              style={{
                fontSize: '17px',
                color: '#334155',
                lineHeight: '1.7',
                maxWidth: '560px',
                marginBottom: '30px',
              }}
            >
              Share one PIN, collect live votes, and present the results instantly to your audience. No fake data, no static placeholders.
            </p>

            <div
              style={{
                background: 'rgba(255,255,255,0.42)',
                border: '1px solid rgba(14, 165, 233, 0.18)',
                boxShadow: '0 18px 32px rgba(14, 165, 233, 0.08)',
                borderRadius: '18px',
                padding: '18px 20px 20px',
                maxWidth: '620px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #22c55e, #15803d)',
                    boxShadow: '0 10px 20px rgba(34,197,94,0.28)',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>👥</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '12px', fontSize: '15px' }}>
                    Join a live poll by PIN
                  </div>

                  <form onSubmit={handleJoinByPin} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {pinDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          onPaste={handlePaste}
                          className="pin-digit-box"
                          placeholder={String(idx + 1)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: '1px solid rgba(15, 23, 42, 0.14)',
                            background: '#fff',
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        border: 'none',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '11px 18px',
                        cursor: 'pointer',
                        minWidth: '94px',
                        boxShadow: '0 12px 22px rgba(34,197,94,0.28)',
                      }}
                    >
                      {loading ? 'Joining...' : 'Join →'}
                    </button>
                  </form>

                  {error && (
                    <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div style={{ color: '#475569', fontSize: '12px', marginTop: '10px' }}>
                    No account required • join instantly and vote live
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside
            style={{
              background: 'rgba(255,255,255,0.48)',
              border: '1px solid rgba(14, 165, 233, 0.12)',
              borderRadius: '18px',
              padding: '18px 18px 10px',
              boxShadow: '0 20px 36px rgba(14,165,233,0.08)',
            }}
          >
            {isAuthenticated && activePollData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>Live hosting</div>
                  <div
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '6px 10px',
                      border: '1px solid rgba(34,197,94,0.18)',
                    }}
                  >
                    LIVE
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{activePollData.title}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>PIN: {activePollData.code}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                  {livePollOptions.map((option) => {
                    const voteCount = liveOptionCounts[option.id] || 0;
                    const percent = liveTotalVotes > 0 ? Math.round((voteCount / liveTotalVotes) * 100) : 0;

                    return (
                      <div key={option.id || option.text} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 52px', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '10px',
                            background: option.color || '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 800,
                          }}
                        >
                          {String.fromCharCode(65 + (livePollOptions.indexOf(option) % 26))}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{option.text}</div>
                          <div style={{ height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                borderRadius: '999px',
                                background: 'linear-gradient(90deg, #22c55e, #86efac)',
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{percent}%</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>Live activity</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>{liveTotalVotes} votes</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {liveRecentVoters.length > 0 ? (
                      liveRecentVoters.slice(0, 5).map((voter, idx) => (
                        <div key={`${voter}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: ['#22c55e', '#38bdf8', '#a78bfa', '#fbbf24', '#f97316'][idx % 5],
                              color: '#fff',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {voter.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, color: '#0f172a' }}>
                            <span style={{ fontWeight: 700 }}>{voter}</span> voted live
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                        No votes yet. Share the PIN and start collecting responses.
                      </div>
                    )}
                  </div>

                  {selectedUserPollId && (
                    <div style={{ marginTop: '18px' }}>
                      <Link
                        to={`/present/${selectedUserPollId}`}
                        style={{
                          textDecoration: 'none',
                          display: 'inline-block',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '10px 16px',
                          borderRadius: '10px',
                        }}
                      >
                        Open presenter view
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>Host in realtime</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Ready</div>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                  Start a live poll in seconds
                </div>

                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, marginBottom: '18px' }}>
                  Create a poll from your dashboard, share the PIN, and collect real-time audience reactions as votes arrive.
                </div>

                <Link
                  to={isAuthenticated ? '/create' : '/login'}
                  style={{
                    textDecoration: 'none',
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                  }}
                >
                  {isAuthenticated ? 'Create live poll' : 'Sign in to host'}
                </Link>
              </>
            )}
          </aside>
        </main>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '20px',
            marginBottom: '26px',
          }}
        >
          {[
            ['📊', 'Poll by PIN', 'Send a 6-digit code and let anyone join instantly without a sign-up flow.'],
            ['⚡', 'Live results', 'Watch vote totals update in real time as responses arrive.'],
            ['🎯', 'Presenter mode', 'Open the host view to guide the room and keep the conversation moving.'],
          ].map(([icon, title, text]) => (
            <div key={title} style={{ background: '#f0fdf4', borderRadius: '18px', padding: '26px 22px', border: '1px solid rgba(15,23,42,0.06)', minHeight: '170px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ fontSize: '32px' }}>{icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{title}</div>
              </div>
              <div style={{ color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>{text}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.52), rgba(224,242,254,0.7))',
            border: '1px solid rgba(14,165,233,0.12)',
            borderRadius: '18px',
            padding: '26px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginTop: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '34px' }}>🚀</div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px' }}>
                Ready to host your next live decision?
              </div>
              <div style={{ color: '#475569', fontSize: '16px', marginTop: '6px' }}>
                Create a poll, open the presenter view, and engage your audience live.
              </div>
            </div>
          </div>

          <Link
            to={isAuthenticated ? '/create' : '/login'}
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '18px',
              padding: '16px 28px',
              borderRadius: '12px',
              boxShadow: '0 14px 28px rgba(34,197,94,0.28)',
            }}
          >
            {isAuthenticated ? 'Create poll →' : 'Sign in →'}
          </Link>
        </section>
      </div>

      <footer
        style={{
          maxWidth: '1240px',
          margin: '26px auto 0',
          padding: '18px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px',
          color: '#475569',
          borderTop: '1px solid rgba(15,23,42,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: '#0f172a' }}>
          <div style={{ fontSize: '18px' }}>🟢</div>
          <span>SyncPoll</span>
        </div>
        <div style={{ fontSize: '14px', color: '#475569' }}>Live polling for teams, classrooms, and events.</div>
        <div style={{ fontSize: '14px', color: '#334155' }}>Realtime hosting</div>
      </footer>

      {qrModalPoll && (
        <QRModal
          poll={qrModalPoll}
          isOpen={!!qrModalPoll}
          onClose={() => setQrModalPoll(null)}
        />
      )}
    </div>
  );
}
