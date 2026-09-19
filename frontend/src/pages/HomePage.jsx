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

  return (
    <div className="container-main" style={{ paddingTop: '28px' }}>
      {/* 2-COLUMN HERO SECTION (Matching the reference mockup) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '40px',
          alignItems: 'start',
          marginBottom: '48px',
        }}
      >
        {/* LEFT COLUMN: Hero Headline, Badges, & 6-Digit PIN Join Box */}
        <div style={{ textAlign: 'left' }}>
          {/* Top Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'var(--cyan-soft)',
              border: '1px solid var(--cyan-soft-border)',
              marginBottom: '20px',
            }}
          >
            <Zap size={15} color="var(--primary)" fill="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
              Next-Gen Realtime Decision Platform
            </span>
          </div>

          {/* Main Hero Heading */}
          <h1
            style={{
              fontSize: '52px',
              fontWeight: '900',
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              color: 'var(--text-primary)',
              marginBottom: '18px',
            }}
          >
            Live Polling & <br />
            <span style={{ color: 'var(--primary)' }}>Spatial Consensus</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '540px',
              marginBottom: '28px',
            }}
          >
            Engage your live audience in real time. Single-choice polls and head-to-head clashes updating at sub-millisecond speed without refreshing.
          </p>

          {/* 3 Key Feature Highlights (Row) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              marginBottom: '36px',
            }}
          >
            {/* Feature 1: Real-time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--cyan-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Real-time</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sub-millisecond updates</div>
              </div>
            </div>

            {/* Feature 2: Scalable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--cyan-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Scalable</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Built with Go & Redis</div>
              </div>
            </div>

            {/* Feature 3: Reliable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--cyan-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Reliable</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Low latency, high uptime</div>
              </div>
            </div>
          </div>

          {/* Quick Join PIN Card (Matching reference mockup!) */}
          <div
            style={{
              background: 'var(--cyan-soft-card)',
              border: '1px solid var(--cyan-soft-border)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '560px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {/* Blue Circular Icon */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 166, 244, 0.3)',
                }}
              >
                <Users size={22} color="#ffffff" />
              </div>

              {/* Input and Controls */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '14px',
                  }}
                >
                  Have a poll PIN? Join instantly
                </div>

                <form onSubmit={handleJoinByPin}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    {/* 6 Individual Digit Inputs */}
                    <div style={{ display: 'flex', gap: '6px' }}>
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
                        />
                      ))}
                    </div>

                    {/* Join Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-pill-primary"
                      style={{ padding: '10px 22px', fontSize: '15px', minWidth: '95px' }}
                    >
                      {loading ? (
                        'Joining...'
                      ) : (
                        <>
                          <span>Join</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {error && (
                  <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  No account required • Join and participate in seconds
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Unified Showcase with Choice Poll Diagram & Tug-of-War Clash Suitable Diagram */}
        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isAuthenticated ? (
            /* 1. WITHOUT LOGIN: No details shown, clean empty placeholder card */
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                padding: '56px 32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan-soft-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Radio size={30} color="var(--primary)" />
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px' }}>
                Live Polling Stage
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 28px' }}>
                Sign in to create a live poll. Once created, your live poll, options, and real-time audience votes will appear right here.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
                <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '11px 24px', fontSize: '14px', fontWeight: '700', gap: '6px' }}>
                  <span>Sign In to Host</span>
                  <ArrowRight size={15} />
                </Link>
                <Link to="/register" className="btn-secondary" style={{ textDecoration: 'none', padding: '11px 20px', fontSize: '14px', fontWeight: '700' }}>
                  <span>Get Started Free</span>
                </Link>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%', maxWidth: '360px' }}>
                💡 Have a poll PIN? Enter your 6-digit code on the left to vote instantly without an account.
              </div>
            </div>
          ) : (
            /* 2. AFTER LOGIN */
            <>
              {/* Creator Status Bar */}
              <div
                style={{
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan-soft-border)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    👋 Welcome, {user?.username || 'Creator'}!
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {userPolls.length > 0
                      ? `You have ${userPolls.length} ${userPolls.length === 1 ? 'poll' : 'polls'} active in your studio.`
                      : 'Create your first live poll below to start collecting audience votes!'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Link to="/create" className="btn-primary" style={{ textDecoration: 'none', padding: '7px 16px', fontSize: '13px', gap: '6px' }}>
                    <Plus size={14} />
                    <span>Create Poll</span>
                  </Link>
                  <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px' }}>
                    <span>Creator Studio</span>
                  </Link>
                </div>
              </div>

              {userPollsLoading ? (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '60px 24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Loading your polls...</span>
                  </div>
                </div>
              ) : userPolls.length === 0 ? (
                /* Empty Creator State: User has not created a poll yet */
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '48px 32px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '360px',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'var(--cyan-soft)',
                      border: '1px solid var(--cyan-soft-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <BarChart2 size={30} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    No Polls Created Yet
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 24px' }}>
                    Create your first live poll in under 30 seconds. Once voters submit their votes, the live results and voter list will appear right here in real time!
                  </p>
                  <Link to="/create" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '14px', fontWeight: '700', gap: '8px' }}>
                    <Plus size={16} />
                    <span>Create First Poll</span>
                  </Link>
                </div>
              ) : activePollData ? (
                /* User HAS created poll(s): SHOW THE REAL POLL & REAL VOTER VOTES! */
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '24px',
                  }}
                >
                  {/* Card Top Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-dot" />
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {activePollData.type === 'clash' ? 'Live Clash Battle' : 'Live Poll'}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--cyan-soft)',
                          color: 'var(--primary)',
                          border: '1px solid var(--cyan-soft-border)',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        PIN: {activePollData.code}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <Users size={14} />
                        <span>
                          {(activePollState?.total_votes ?? activePollData.total_votes ?? 0)} {(activePollState?.total_votes ?? activePollData.total_votes ?? 0) === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>

                      <span className={`badge ${activePollData.is_active ? 'badge-live' : 'badge-closed'}`}>
                        {activePollData.is_active ? 'LIVE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>

                  {/* Multiple Polls Selector Switcher (if user has > 1 poll) */}
                  {userPolls.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
                      {userPolls.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedUserPollId(p.id)}
                          className="btn-secondary"
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            whiteSpace: 'nowrap',
                            background: p.id === activePollData.id ? 'var(--cyan-soft)' : undefined,
                            borderColor: p.id === activePollData.id ? 'var(--primary)' : undefined,
                            color: p.id === activePollData.id ? 'var(--primary)' : undefined,
                            fontWeight: p.id === activePollData.id ? '700' : '500',
                          }}
                        >
                          {p.title.length > 22 ? p.title.slice(0, 22) + '...' : p.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Real Poll Title */}
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      marginBottom: '16px',
                    }}
                  >
                    {activePollData.title}
                  </h3>

                  {/* If Choice Poll */}
                  {activePollData.type === 'choice' && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                        marginBottom: '20px',
                      }}
                    >
                      {/* Real Poll Options with Real Progress Bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        {activePollData.options?.map((opt, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          const count = activePollState?.option_counts?.[opt.id] ?? 0;
                          const total = activePollState?.total_votes ?? activePollData.total_votes ?? 0;
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const barGradients = [
                            'linear-gradient(90deg, #00b4d8, #00a6f4)',
                            'linear-gradient(90deg, #f43f5e, #ec4899)',
                            'linear-gradient(90deg, #10b981, #059669)',
                            'linear-gradient(90deg, #f59e0b, #d97706)',
                          ];
                          const badgeColors = ['#00a6f4', '#ec4899', '#10b981', '#f59e0b'];

                          return (
                            <div
                              key={opt.id}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '14px',
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '8px',
                                      background: badgeColors[idx % badgeColors.length],
                                      color: '#ffffff',
                                      fontWeight: '800',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {letter}
                                  </div>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {opt.text}
                                  </span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                  {pct}% <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>({count})</span>
                                </span>
                              </div>
                              <div
                                style={{
                                  height: '6px',
                                  borderRadius: '9999px',
                                  background: 'var(--border-subtle)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  className="progress-fill"
                                  style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: barGradients[idx % barGradients.length],
                                    borderRadius: '9999px',
                                    transition: 'width 0.4s ease',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Real Live Activity Feed (Real Voters Only) */}
                      <div
                        style={{
                          borderLeft: '1px solid var(--border-subtle)',
                          paddingLeft: '16px',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Users size={15} color="var(--primary)" />
                          <span>Who Voted</span>
                        </div>

                        {activePollState?.recent_voters && activePollState.recent_voters.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activePollState.recent_voters.map((name, idx) => (
                              <div
                                key={`${name}-${idx}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 10px',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: '10px',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '12px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      background: 'var(--primary)',
                                      color: '#ffffff',
                                      fontWeight: '700',
                                      fontSize: '11px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {name[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{name}</span>
                                </div>
                                <span style={{ color: 'var(--emerald)', fontSize: '11px', fontWeight: '600' }}>✓ voted</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5 }}>
                            <Users size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>No votes cast yet</div>
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>
                              Share PIN <strong>{activePollData.code}</strong> to collect live votes!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Clash Poll */}
                  {activePollData.type === 'clash' && activePollData.options && activePollData.options.length >= 2 && (() => {
                    const optA = activePollData.options[0];
                    const optB = activePollData.options[1];
                    const countA = activePollState?.option_counts?.[optA.id] ?? 0;
                    const countB = activePollState?.option_counts?.[optB.id] ?? 0;
                    const tot = activePollState?.total_votes ?? activePollData.total_votes ?? 0;
                    const pctA = tot > 0 ? Math.round((countA / tot) * 100) : 50;
                    const pctB = 100 - pctA;

                    return (
                      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ background: 'var(--cyan-soft)', border: '1.5px solid var(--primary)', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>Team A</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0' }}>{optA.text}</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{pctA}%</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{countA} {countA === 1 ? 'vote' : 'votes'}</div>
                          </div>

                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Swords size={18} color="var(--primary)" />
                          </div>

                          <div style={{ background: 'var(--pink-soft)', border: '1.5px solid #ec4899', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#ec4899', textTransform: 'uppercase' }}>Team B</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0' }}>{optB.text}</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ec4899', fontFamily: 'var(--font-mono)' }}>{pctB}%</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{countB} {countB === 1 ? 'vote' : 'votes'}</div>
                          </div>
                        </div>

                        {/* Tug-of-War SVG Diagram */}
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '14px 18px', marginBottom: '14px' }}>
                          <svg viewBox="0 0 520 100" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                            <line x1="20" y1="85" x2="500" y2="85" stroke="var(--border-subtle)" strokeWidth="2" strokeDasharray="4 4" />
                            <line x1="260" y1="10" x2="260" y2="85" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="2" strokeDasharray="3 3" />
                            <text x="260" y="8" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="800">50% MARK</text>
                            <g transform="translate(30, 20)">
                              <circle cx="20" cy="18" r="9" fill="#00a6f4" />
                              <path d="M 20,27 L 10,58 M 20,38 L 42,44" stroke="#00a6f4" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="70" cy="20" r="9" fill="#00b4d8" />
                              <path d="M 70,29 L 60,58 M 70,40 L 92,44" stroke="#00b4d8" strokeWidth="4" strokeLinecap="round" />
                            </g>
                            <g transform="translate(380, 20)">
                              <circle cx="35" cy="20" r="9" fill="#ec4899" />
                              <path d="M 35,29 L 45,58 M 35,40 L 13,44" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="85" cy="18" r="9" fill="#f43f5e" />
                              <path d="M 85,27 L 95,58 M 85,38 L 63,44" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                            </g>
                            <path d="M 30,60 Q 145,64 260,60 T 490,60" fill="none" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
                            <path d="M 30,60 Q 145,64 260,60 T 490,60" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
                            <g transform={`translate(${Math.max(120, Math.min(400, 260 + (pctA - 50) * 3.6))}, 60)`} style={{ transition: 'transform 0.3s ease' }}>
                              <circle cx="0" cy="0" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                              <polygon points="-5,0 5,0 0,22" fill="#ef4444" />
                            </g>
                          </svg>
                          <div style={{ display: 'flex', height: '12px', borderRadius: '9999px', overflow: 'hidden', background: 'var(--border-subtle)', marginTop: '8px' }}>
                            <div style={{ width: `${pctA}%`, background: 'linear-gradient(90deg, #00b4d8, #00a6f4)', transition: 'width 0.3s ease' }} />
                            <div style={{ width: `${pctB}%`, background: 'linear-gradient(90deg, #f43f5e, #ec4899)', transition: 'width 0.3s ease' }} />
                          </div>
                        </div>

                        {/* Who Voted List */}
                        {activePollState?.recent_voters && activePollState.recent_voters.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Voters:</span>
                            {activePollState.recent_voters.map((name, i) => (
                              <span key={i} className="badge" style={{ background: 'var(--cyan-soft)', color: 'var(--text-primary)', fontSize: '11px', border: '1px solid var(--cyan-soft-border)' }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Card Bottom Quick Actions */}
                  <div
                    style={{
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <Link
                      to={`/present/${activePollData.id}`}
                      className="btn-primary"
                      style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px' }}
                    >
                      <Tv size={15} />
                      <span>Presenter Stage</span>
                    </Link>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setQrModalPoll(activePollData)}
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '13px', gap: '6px' }}
                        title="Show QR Code"
                      >
                        <QrCode size={15} />
                        <span>Show QR</span>
                      </button>

                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/vote/${activePollData.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '13px', gap: '6px' }}
                        title="Copy Vote Link"
                      >
                        {copiedLink ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
                        <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* TWO CORE FEATURE CARDS (Matching the reference mockup) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          textAlign: 'left',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: Live Choice Polls */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--cyan-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <BarChart2 size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Live Choice Polls
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Classic single and multi-select polls with dynamically animating progress bars, leaderboards, and real-time insights.
            </p>
          </div>
          <Link
            to="/create"
            style={{
              textDecoration: 'none',
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Explore</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Card 2: Tug-of-War Clashes */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--pink-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Swords size={24} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Tug-of-War Clashes
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              High-octane 1-on-1 debate battles with a dynamically shifting meter and live audience momentum.
            </p>
          </div>
          <Link
            to="/create"
            style={{
              textDecoration: 'none',
              color: '#ec4899',
              fontWeight: '700',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Start a Clash</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* BOTTOM ACTION BANNER (Matching the reference mockup) */}
      <div
        style={{
          background: 'var(--cyan-soft-card)',
          border: '1px solid var(--cyan-soft-border)',
          borderRadius: '20px',
          padding: '24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--cyan-soft)',
              border: '1.5px solid var(--cyan-soft-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trophy size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Empower Discussions. Make Decisions Together.
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              From classrooms to conferences, SyncPoll makes every voice count.
            </div>
          </div>
        </div>

        <Link
          to="/create"
          className="btn-pill-primary"
          style={{ textDecoration: 'none', fontSize: '15px', padding: '11px 24px', whiteSpace: 'nowrap' }}
        >
          <Plus size={16} />
          <span>Create a Poll</span>
          <ArrowRight size={16} />
        </Link>
      </div>

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
