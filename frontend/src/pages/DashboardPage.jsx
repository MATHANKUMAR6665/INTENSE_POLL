import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { QRModal } from '../components/QRModal';
import {
  PlusCircle,
  Tv,
  ExternalLink,
  QrCode,
  Trash2,
  Play,
  Pause,
  BarChart2,
  Grid,
  Swords,
  Users,
  Copy,
  Check,
} from 'lucide-react';

export function DashboardPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchPolls();
  }, [isAuthenticated, navigate]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await api.listPolls();
      setPolls(data);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (poll) => {
    try {
      const updated = !poll.is_active;
      await api.updatePollStatus(poll.id, { is_active: updated });
      setPolls((prev) =>
        prev.map((p) => (p.id === poll.id ? { ...p, is_active: updated } : p))
      );
    } catch (err) {
      alert('Failed to update poll: ' + err.message);
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this poll?')) return;
    try {
      await api.deletePoll(id);
      setPolls((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Failed to delete poll: ' + err.message);
    }
  };

  const handleCopyLink = (poll) => {
    const url = `${window.location.origin}/vote/${poll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(poll.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalVotesCount = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);
  const activePollsCount = polls.filter((p) => p.is_active).length;

  return (
    <div className="container-main" style={{ paddingTop: '20px' }}>
      {/* Header & New Poll CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Creator Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
            Manage live polls, launch presentation stages, and review audience analytics.
          </p>
        </div>
        <Link to="/create" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px' }}>
          <PlusCircle size={18} />
          <span>Create New Poll</span>
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL POLLS</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {polls.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--emerald)', textTransform: 'uppercase' }}>ACTIVE SESSIONS</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {activePollsCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--cyan)', textTransform: 'uppercase' }}>TOTAL VOTES RECORDED</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {totalVotesCount}
          </div>
        </div>
      </div>

      {/* Polls List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your polls...
        </div>
      ) : polls.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <BarChart2 size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No polls created yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px' }}>
            Create your first interactive choice or clash poll to engage your audience in real-time.
          </p>
          <Link to="/create" className="btn-primary" style={{ textDecoration: 'none' }}>
            <PlusCircle size={16} />
            <span>Create Poll</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {polls.map((poll) => {
            const isLive = poll.is_active;

            return (
              <div
                key={poll.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px',
                  textAlign: 'left',
                }}
              >
                {/* Left: Poll Title & Metadata */}
                <div style={{ flex: '1 1 340px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className={`badge ${isLive ? 'badge-live' : 'badge-closed'}`}>
                      {isLive && <span className="pulse-dot" />}
                      {isLive ? 'LIVE & ACCEPTING VOTES' : 'PAUSED'}
                    </span>
                    <span className="badge" style={{ background: 'var(--cyan-soft)', color: 'var(--text-secondary)', border: '1px solid var(--cyan-soft-border)' }}>
                      {poll.type === 'clash' ? 'TUG-OF-WAR CLASH' : 'CHOICE POLL'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      PIN: {poll.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {poll.title}
                  </h3>

                  {poll.description && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                      {poll.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>{poll.total_votes || 0} votes</span>
                    <span>•</span>
                    <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Presenter Stage Button */}
                  <Link
                    to={`/present/${poll.id}`}
                    className="btn-primary"
                    style={{ textDecoration: 'none', padding: '9px 16px', fontSize: '14px' }}
                  >
                    <Tv size={16} />
                    <span>Presenter Stage</span>
                  </Link>

                  {/* QR Code Button */}
                  <button
                    onClick={() => setSelectedQR(poll)}
                    className="btn-secondary"
                    style={{ padding: '9px 14px', fontSize: '14px' }}
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                    <span>QR</span>
                  </button>

                  {/* Copy Link Button */}
                  <button
                    onClick={() => handleCopyLink(poll)}
                    className="btn-secondary"
                    style={{ padding: '9px 14px', fontSize: '14px' }}
                    title="Copy Audience Voting Link"
                  >
                    {copiedId === poll.id ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  </button>

                  {/* Toggle Active/Pause */}
                  <button
                    onClick={() => handleToggleStatus(poll)}
                    className="btn-secondary"
                    style={{ padding: '9px 14px', fontSize: '14px' }}
                    title={isLive ? 'Pause Voting' : 'Resume Voting'}
                  >
                    {isLive ? <Pause size={16} color="#fbbf24" /> : <Play size={16} color="#34d399" />}
                  </button>

                  {/* Delete Poll */}
                  <button
                    onClick={() => handleDeletePoll(poll.id)}
                    className="btn-danger"
                    style={{ padding: '9px 12px' }}
                    title="Delete Poll"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      <QRModal
        poll={selectedQR}
        isOpen={!!selectedQR}
        onClose={() => setSelectedQR(null)}
      />
    </div>
  );
}
