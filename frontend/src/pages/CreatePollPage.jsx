import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Swords, Plus, Trash2, ArrowRight } from 'lucide-react';

export function CreatePollPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const [pollType, setPollType] = useState('choice'); // 'choice' | 'clash'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['Option A', 'Option B', 'Option C']);
  const [clashOptions, setClashOptions] = useState(['Option A', 'Option B']);

  const [allowMultiple, setAllowMultiple] = useState(false);
  const [durationMins, setDurationMins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, val) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a poll question or title');
      return;
    }

    if (cleanTitle.length < 2) {
      setError('Poll question must be at least 2 characters long');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: cleanTitle,
        description: description.trim(),
        type: pollType,
        allow_multiple: allowMultiple,
        duration_mins: parseInt(durationMins) || 0,
      };

      if (pollType === 'choice') {
        const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
        if (cleanOpts.length < 2) throw new Error('At least 2 non-empty options are required');
        payload.options = cleanOpts;
      } else if (pollType === 'clash') {
        const cleanOpts = clashOptions.map((o) => o.trim()).filter(Boolean);
        if (cleanOpts.length !== 2) throw new Error('Clash requires exactly 2 options');
        payload.options = cleanOpts;
      }

      const createdPoll = await api.createPoll(payload);
      navigate(`/present/${createdPoll.id}`);
    } catch (err) {
      let msg = err.message || 'Failed to create poll';
      if (msg.includes('Field validation for') && msg.includes("'min' tag")) {
        msg = 'Poll title must be at least 2 characters long';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main" style={{ maxWidth: '680px', paddingTop: '20px', textAlign: 'left' }}>
      <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
        Create a New Poll
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
        Configure your live session, pick an engagement format, and launch to your audience.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Step 1: Select Format */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <label style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '14px' }}>
            1. Select Polling Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {/* Format: Choice */}
            <div
              onClick={() => setPollType('choice')}
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: pollType === 'choice' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                border: pollType === 'choice' ? '2px solid #6366f1' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <BarChart2 size={24} color="#818cf8" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '15px' }}>Choice Poll</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Single or multi-select options
              </div>
            </div>

            {/* Format: Clash */}
            <div
              onClick={() => setPollType('clash')}
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: pollType === 'clash' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                border: pollType === 'clash' ? '2px solid #ec4899' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Swords size={24} color="#f472b6" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '15px' }}>Tug-of-War Clash</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Head-to-head 2 options battle
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Poll Details */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <label style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '14px' }}>
            2. Question & Description
          </label>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Poll Question / Title *
              </label>
              <span style={{ fontSize: '12px', color: title.length > 0 && title.trim().length < 2 ? '#f87171' : 'var(--text-muted)' }}>
                {title.length > 0 && title.trim().length < 2 ? 'Min 2 characters required' : 'Min 2 characters'}
              </span>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Which programming language do you prefer for microservices?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Additional Context / Description (Optional)
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Provide background info for your voters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Step 3: Poll Options */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <label style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '14px' }}>
            3. Poll Options
          </label>

          {/* Choice Mode Options */}
          {pollType === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                    {String.fromCharCode(65 + i)}.
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="btn-danger"
                      style={{ padding: '10px 12px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '13px', padding: '8px 16px' }}
                >
                  <Plus size={16} />
                  <span>Add Option</span>
                </button>
              )}

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="multiSelect"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="multiSelect" style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Allow audience to select multiple options
                </label>
              </div>
            </div>
          )}

          {/* Clash Mode Options */}
          {pollType === 'clash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#818cf8', display: 'block', marginBottom: '6px' }}>
                  Fighter A (Left)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={clashOptions[0]}
                  onChange={(e) => setClashOptions([e.target.value, clashOptions[1]])}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#f472b6', display: 'block', marginBottom: '6px' }}>
                  Fighter B (Right)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={clashOptions[1]}
                  onChange={(e) => setClashOptions([clashOptions[0], e.target.value])}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit & Launch */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ padding: '16px', fontSize: '16px', width: '100%' }}
        >
          {loading ? 'Creating Poll & Connecting Realtime...' : (
            <>
              <span>Launch & Open Presenter Stage</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
