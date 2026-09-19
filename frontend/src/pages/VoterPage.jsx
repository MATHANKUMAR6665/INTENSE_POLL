import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { usePollSocket } from '../hooks/usePollSocket';
import { getBrowserFingerprint } from '../utils/fingerprint';
import { ChoiceViewer } from '../components/ChoiceViewer';
import { ClashViewer } from '../components/ClashViewer';
import { ReactionOverlay } from '../components/ReactionOverlay';
import { QRModal } from '../components/QRModal';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Lock,
  Radio,
  Send,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  User,
  Edit2,
} from 'lucide-react';

// Storage key to prevent repeat votes from the same device
const VOTED_KEY = 'syncpoll_voted';

// Safe localStorage access in case private browsing mode blocks writes
const getStoredVoteMap = () => {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || '{}');
  } catch {
    return {};
  }
};

const markPollAsVoted = (pollId) => {
  try {
    const map = getStoredVoteMap();
    map[pollId] = true;
    localStorage.setItem(VOTED_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Could not store vote status in localStorage:', err);
  }
};

export function VoterPage() {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lazy state init directly from storage prevents an initial flash of unvoted UI
  const [hasVoted, setHasVoted] = useState(() => {
    if (!id) return false;
    return Boolean(getStoredVoteMap()[id]);
  });

  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Participant selection state
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Voter identity state (requested: after scanning, voter enters name)
  const [voterName, setVoterName] = useState(() => {
    try {
      return localStorage.getItem('syncpoll_voter_name') || '';
    } catch {
      return '';
    }
  });
  const [nameSubmitted, setNameSubmitted] = useState(() => {
    try {
      return Boolean(localStorage.getItem('syncpoll_voter_name'));
    } catch {
      return false;
    }
  });
  const [nameInput, setNameInput] = useState(voterName);

  const handleNameSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter your name to participate in this poll');
      return;
    }
    setError('');
    setVoterName(trimmed);
    setNameSubmitted(true);
    try {
      localStorage.setItem('syncpoll_voter_name', trimmed);
    } catch (err) {
      console.warn('Could not save voter name:', err);
    }
  };

  // Handle live incoming emojis from other voters
  const handleIncomingReaction = useCallback((emoji) => {
    const reaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji,
      x: 12 + Math.random() * 76,
      size: 24 + Math.floor(Math.random() * 12),
    };

    setFloatingReactions((prev) => [...prev, reaction]);

    // Prune emoji once the 2.8s float animation wraps up
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2800);
  }, []);

  const { liveState, connected } = usePollSocket(id, handleIncomingReaction);

  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getPoll(id);
      setPoll(res.poll);
    } catch (err) {
      setError(err.message || 'Poll not found or is no longer accessible');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleCopyPin = async () => {
    if (!poll?.code) return;
    try {
      await navigator.clipboard.writeText(poll.code);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 1800);
    } catch {
      // Ignore if clipboard permissions are restricted
    }
  };

  const handleSelectOption = (optId) => {
    if (hasVoted || !poll) return;

    if (poll.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optId) ? prev.filter((o) => o !== optId) : [...prev, optId]
      );
    } else {
      setSelectedOptions([optId]);
    }
  };

  const handleSendReaction = async (emoji) => {
    // Show reaction optimistically on local voter screen
    handleIncomingReaction(emoji);
    try {
      await api.sendReaction(id, emoji);
    } catch {
      // Non-critical, drop reaction silently
    }
  };

  const handleCastVote = async () => {
    if (hasVoted || submitting) return;
    setError('');

    // Pre-flight validation
    if (selectedOptions.length === 0) {
      setError('Please select an option to submit your vote');
      return;
    }

    setSubmitting(true);

    try {
      const fingerprint = getBrowserFingerprint();
      const payload = {
        fingerprint,
        option_ids: selectedOptions,
        voter_name: voterName.trim() || 'Anonymous',
      };

      await api.castVote(id, payload);

      // Persist locally to prevent duplicate re-submissions
      markPollAsVoted(id);
      setHasVoted(true);
      fetchPoll();

      // Celebration burst
      confetti({
        particleCount: 65,
        spread: 68,
        origin: { y: 0.72 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch (err) {
      const message = err.message || '';
      if (message.toLowerCase().includes('already voted')) {
        markPollAsVoted(id);
        setHasVoted(true);
      }
      setError(message || 'Unable to submit your vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-main" style={{ maxWidth: '460px', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Connecting to live session...</span>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="container-main" style={{ maxWidth: '460px', padding: '60px 20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '36px 24px' }}>
          <AlertCircle size={44} color="#f87171" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Unable to Load Poll
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            {error}
          </p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 20px' }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isLive = Boolean(poll.is_active);
  const showResults = Boolean(poll.show_results);
  const totalVotes = liveState?.total_votes ?? poll.total_votes ?? 0;

  const pollTypeLabel =
    poll.type === 'clash'
      ? 'Head-to-Head Clash'
      : poll.allow_multiple
      ? 'Multiple Choice'
      : 'Single Choice';

  return (
    <div className="container-main" style={{ maxWidth: '620px', padding: '24px 16px 40px' }}>
      <ReactionOverlay
        floatingReactions={floatingReactions}
        onSendReaction={handleSendReaction}
        showButtons={true}
      />

      {/* Session status header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${isLive ? 'badge-live' : 'badge-closed'}`}>
            {isLive && <span className="pulse-dot" />}
            {isLive ? 'Voting Active' : 'Voting Paused'}
          </span>
          {connected && (
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11px',
                gap: '5px',
              }}
            >
              <Radio size={12} /> Live
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyPin}
            className="btn-secondary"
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
            title="Click to copy poll PIN"
          >
            <span>PIN: {poll.code}</span>
            {copiedPin ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12px', gap: '6px' }}
            title="Share this poll"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main poll card */}
      <div className="glass-panel" style={{ padding: '28px 24px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: '10px',
        }}>
          {pollTypeLabel}
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: '700', lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: poll.description ? '10px' : '20px' }}>
          {poll.title}
        </h1>

        {poll.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '22px' }}>
            {poll.description}
          </p>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              borderRadius: '10px',
              padding: '11px 14px',
              fontSize: '13px',
              marginBottom: '18px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!hasVoted ? (
          <div>
            {!nameSubmitted ? (
              /* Voter Name Entry Prompt Card (Shows right after scanning QR code / opening link) */
              <div
                style={{
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan-soft-border)',
                  borderRadius: '16px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  marginTop: '16px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    boxShadow: '0 4px 12px rgba(0, 166, 244, 0.3)',
                  }}
                >
                  <User size={24} color="#ffffff" />
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Enter your name to join
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                  Your name will be visible to the presenter when your vote is recorded.
                </p>

                <form onSubmit={handleNameSubmit} style={{ maxWidth: '340px', margin: '0 auto' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter your name (e.g. Kugan)"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setError('');
                    }}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      textAlign: 'center',
                      marginBottom: '14px',
                      borderRadius: '12px',
                    }}
                  />

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px 20px', fontSize: '15px', fontWeight: '700' }}
                  >
                    <span>Continue to Vote</span>
                    <Send size={15} />
                  </button>
                </form>
              </div>
            ) : !isLive ? (
              <div
                style={{
                  padding: '28px 20px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.22)',
                  borderRadius: '12px',
                  marginTop: '12px',
                  textAlign: 'center',
                }}
              >
                <Lock size={28} color="#fbbf24" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#fef3c7' }}>
                  Voting is temporarily paused
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  The host has paused submissions for a moment. This view will update automatically.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                {/* Voter attribution pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'var(--cyan-soft)',
                    borderRadius: '10px',
                    border: '1px solid var(--cyan-soft-border)',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} color="var(--primary)" />
                    <span>Voting as: <strong style={{ color: 'var(--text-primary)' }}>{voterName}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNameSubmitted(false)}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                    title="Change voter name"
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>
                </div>
                {poll.type === 'choice' && (
                  <ChoiceViewer
                    options={poll.options}
                    optionCounts={{}}
                    totalVotes={0}
                    isVoting={true}
                    selectedOptions={selectedOptions}
                    onSelectOption={handleSelectOption}
                    showPercentages={false}
                  />
                )}

                {poll.type === 'clash' && (
                  <ClashViewer
                    options={poll.options}
                    optionCounts={{}}
                    totalVotes={0}
                    isVoting={true}
                    selectedOption={selectedOptions[0]}
                    onSelectOption={(optId) => setSelectedOptions([optId])}
                    showPercentages={false}
                  />
                )}

                <button
                  type="button"
                  onClick={handleCastVote}
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    marginTop: '22px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Submitting vote...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Vote</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '14px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <CheckCircle2 size={26} color="#34d399" />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#34d399' }}>
                    Your vote is recorded!
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {voterName ? `Thanks, ${voterName}! ` : ''}Your vote has been counted in real time.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
                title="Share this poll"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>

            {/* Live Results & Score Display (Visible after voting) */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  Live Results & Scores
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {totalVotes} {totalVotes === 1 ? 'vote cast' : 'votes cast'}
                </div>
              </div>

              {poll.type === 'choice' && (
                <ChoiceViewer
                  options={poll.options}
                  optionCounts={liveState?.option_counts || {}}
                  totalVotes={totalVotes}
                  isVoting={false}
                  selectedOptions={selectedOptions}
                  showPercentages={true}
                />
              )}

              {poll.type === 'clash' && (
                <ClashViewer
                  options={poll.options}
                  optionCounts={liveState?.option_counts || {}}
                  totalVotes={totalVotes}
                  isVoting={false}
                  selectedOption={selectedOptions[0]}
                  showPercentages={true}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        SyncPoll • Anonymous real-time voting
      </div>

      <QRModal
        poll={poll}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
