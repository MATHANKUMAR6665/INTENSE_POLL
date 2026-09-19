import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { usePollSocket } from '../hooks/usePollSocket';
import { ChoiceViewer } from '../components/ChoiceViewer';
import { ClashViewer } from '../components/ClashViewer';
import { ReactionOverlay } from '../components/ReactionOverlay';
import { QRModal } from '../components/QRModal';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Users,
  Play,
  Pause,
  Eye,
  EyeOff,
  Download,
  Maximize,
  Minimize,
  Radio,
  ArrowLeft,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

export function PresenterPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const [lastVoter, setLastVoter] = useState('');
  const [initialLiveState, setInitialLiveState] = useState(null);
  const [votersList, setVotersList] = useState([]);

  // Handle incoming live reaction
  const handleIncomingReaction = (emoji) => {
    const reactionObj = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      x: 10 + Math.random() * 80, // Random percentage across width
      size: 28 + Math.floor(Math.random() * 16),
    };
    setFloatingReactions((prev) => [...prev, reactionObj]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionObj.id));
    }, 2800);
  };

  const handleIncomingVote = (payload) => {
    if (payload?.voter_name && payload.voter_name !== 'Anonymous') {
      const name = payload.voter_name;
      setLastVoter(name);
      setVotersList((prev) => [name, ...prev.filter((n) => n !== name)]);
      setTimeout(() => setLastVoter(''), 5000);
    }
  };

  // Connect WebSocket with reaction & vote callbacks
  const { liveState, connected, activeViewers } = usePollSocket(id, handleIncomingReaction, handleIncomingVote);

  // Sync recent voters from liveState WebSocket updates
  useEffect(() => {
    if (liveState?.recent_voters && liveState.recent_voters.length > 0) {
      setVotersList((prev) => {
        const unique = [...liveState.recent_voters];
        prev.forEach((n) => {
          if (!unique.includes(n)) unique.push(n);
        });
        return unique;
      });
    }
  }, [liveState?.recent_voters]);

  useEffect(() => {
    fetchPollData();
  }, [id]);

  const fetchPollData = async () => {
    try {
      setLoading(true);
      const data = await api.getPoll(id);
      setPoll(data.poll);
      if (data.live_state) {
        setInitialLiveState(data.live_state);
        if (data.live_state.recent_voters && data.live_state.recent_voters.length > 0) {
          setVotersList(data.live_state.recent_voters);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load poll data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger celebratory confetti on high engagement
  useEffect(() => {
    if (liveState?.total_votes && liveState.total_votes % 10 === 0 && liveState.total_votes > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  }, [liveState?.total_votes]);

  const handleToggleActive = async () => {
    if (!poll) return;
    try {
      const updated = !poll.is_active;
      await api.updatePollStatus(poll.id, { is_active: updated });
      setPoll((prev) => ({ ...prev, is_active: updated }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleResults = async () => {
    if (!poll) return;
    try {
      const updated = !poll.show_results;
      await api.updatePollStatus(poll.id, { show_results: updated });
      setPoll((prev) => ({ ...prev, show_results: updated }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (!poll || !liveState) return;
    let csvContent = 'data:text/csv;charset=utf-8,Option,Votes\n';
    (poll.options || []).forEach((opt) => {
      const count = liveState.option_counts[opt.id] || 0;
      csvContent += `"${opt.text}",${count}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `syncpoll_${poll.id}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleQuickCopyLink = async () => {
    if (!poll) return;
    const voteUrl = `${window.location.origin}/vote/${poll.id}`;
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopiedQuickLink(true);
      setTimeout(() => setCopiedQuickLink(false), 2200);
    } catch {
      setCopiedQuickLink(true);
      setTimeout(() => setCopiedQuickLink(false), 2200);
    }
  };

  if (loading) {
    return (
      <div className="container-main" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Connecting to Presentation Stage...
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="container-main" style={{ padding: '80px', textAlign: 'center' }}>
        <h2 style={{ color: '#f87171' }}>⚠️ {error || 'Poll not found'}</h2>
        <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentLiveState = liveState || initialLiveState;
  const isLive = poll.is_active;
  const showResults = poll.show_results;
  const totalVotes = currentLiveState?.total_votes ?? poll.total_votes ?? 0;
  const optionCounts = currentLiveState?.option_counts || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Floating Reactions */}
      <ReactionOverlay floatingReactions={floatingReactions} showButtons={false} />

      {/* Top Presentation Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left: Back & Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 12px' }} title="Back to Dashboard">
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isLive ? 'badge-live' : 'badge-closed'}`}>
              {isLive && <span className="pulse-dot" />}
              {isLive ? 'LIVE' : 'PAUSED'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Users size={14} color="var(--cyan)" />
              <span style={{ fontWeight: '600' }}>{activeViewers} connected</span>
            </div>
            {connected && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '11px' }}>
                <Radio size={12} /> SYNCED
              </span>
            )}
          </div>
        </div>

        {/* Center: PIN Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.9)', padding: '6px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>JOIN PIN:</span>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '2px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
            {poll.code}
          </span>
        </div>

        {/* Right: Stage Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Share & QR Code Button */}
          <button
            onClick={() => setShowQR(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px', gap: '8px' }}
            title="Open Shareable Link and QR Code Modal"
          >
            <Share2 size={16} />
            <QrCode size={16} />
            <span>Share & QR</span>
          </button>

          {/* Quick Copy Link Button */}
          <button
            onClick={handleQuickCopyLink}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '14px', gap: '6px' }}
            title="Copy Direct Voting Link to Clipboard"
          >
            {copiedQuickLink ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            <span>{copiedQuickLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Toggle Pause/Resume */}
          <button
            onClick={handleToggleActive}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '14px' }}
            title={isLive ? 'Pause Voting' : 'Resume Voting'}
          >
            {isLive ? <Pause size={16} color="#fbbf24" /> : <Play size={16} color="#34d399" />}
            <span>{isLive ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Toggle Results */}
          <button
            onClick={handleToggleResults}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '14px' }}
            title={showResults ? 'Hide Results from Viewers' : 'Show Results to Viewers'}
          >
            {showResults ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Export CSV Results"
          >
            <Download size={16} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Main Presentation Stage Area */}
      <div className="glass-panel" style={{ flex: 1, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Title */}
        <div style={{ maxWidth: '850px', textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {poll.title}
          </h1>
          {poll.description && (
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)' }}>
              {poll.description}
            </p>
          )}
        </div>

        {/* Dynamic Visualizer based on Mode */}
        <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto 28px' }}>
          {poll.type === 'choice' && (
            <ChoiceViewer
              options={poll.options}
              optionCounts={optionCounts}
              totalVotes={totalVotes}
              isVoting={false}
              showPercentages={true}
            />
          )}

          {poll.type === 'clash' && (
            <ClashViewer
              options={poll.options}
              optionCounts={optionCounts}
              totalVotes={totalVotes}
              isVoting={false}
              showPercentages={true}
            />
          )}
        </div>

        {/* Total Votes Ticker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--cyan-soft)', padding: '8px 24px', borderRadius: '30px', border: '1px solid var(--cyan-soft-border)', marginBottom: '22px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.04em' }}>TOTAL AUDIENCE VOTES:</span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {totalVotes}
          </span>
        </div>

        {/* Real-time Voter Toast Notification */}
        {lastVoter && (
          <div style={{
            marginBottom: '20px',
            background: 'var(--cyan-soft)',
            border: '1.5px solid var(--primary)',
            padding: '10px 24px',
            borderRadius: '9999px',
            fontSize: '14px',
            color: 'var(--primary)',
            fontWeight: '800',
            boxShadow: '0 4px 20px rgba(0, 166, 244, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>🎉</span>
            <span>{lastVoter} just cast their vote!</span>
          </div>
        )}

        {/* Dedicated Audience Voters List */}
        <div
          style={{
            width: '100%',
            maxWidth: '850px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '22px 24px',
            boxShadow: 'var(--shadow-card)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--cyan-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Audience Voters
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Real participants who voted in this session
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'var(--cyan-soft)', color: 'var(--primary)', fontWeight: '800', padding: '4px 12px', fontSize: '12px' }}>
                {votersList.length} {votersList.length === 1 ? 'voter' : 'voters'}
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                Live Sync
              </span>
            </div>
          </div>

          {votersList.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {votersList.map((name, idx) => {
                const avatarColors = ['#00a6f4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
                const avatarBg = avatarColors[idx % avatarColors.length];
                return (
                  <div
                    key={`${name}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: avatarBg,
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {name[0]?.toUpperCase() || 'V'}
                      </div>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={name}
                      >
                        {name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        flexShrink: 0,
                      }}
                    >
                      ✓ Voted
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '28px 20px',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <Users size={26} style={{ opacity: 0.35, margin: '0 auto 8px', color: 'var(--text-secondary)' }} />
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Waiting for audience votes...
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Audience can join now with PIN <strong style={{ color: 'var(--primary)' }}>{poll.code}</strong> or scan the QR code
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Big QR Modal */}
      <QRModal
        poll={poll}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </div>
  );
}
