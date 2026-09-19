import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Share2,
  Download,
  MessageCircle,
  Send,
  Mail,
  QrCode,
  Link2
} from 'lucide-react';

export function QRModal({ poll, isOpen, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'link'

  if (!isOpen || !poll) return null;

  const voteUrl = `${window.location.origin}/vote/${poll.id}`;
  const shareTitle = `Vote: ${poll.title} on SyncPoll`;
  const shareText = `Join and vote live in "${poll.title}" (PIN: ${poll.code}) without creating an account:`;

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const copyPinToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(poll.code);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    } catch {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: voteUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyLinkToClipboard();
        }
      }
    } else {
      copyLinkToClipboard();
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('poll-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 48;
      canvas.height = img.height + 48;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 24, 24);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `syncpoll_${poll.code}_qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Social Share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${voteUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(voteUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(voteUrl)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${voteUrl}`)}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '28px 24px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
          }}
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', marginBottom: '8px' }}>
          <Share2 size={18} />
          <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>SHARE & INVITE VOTERS</span>
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
          {poll.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Anyone with this link or QR code can vote instantly without signing up.
        </p>

        {/* Tab Switcher: QR Code vs Direct Link */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'qr' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              color: activeTab === 'qr' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === 'qr' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <QrCode size={16} />
            <span>QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'link' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              color: activeTab === 'link' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === 'link' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Link2 size={16} />
            <span>Share Link</span>
          </button>
        </div>

        {/* TAB 1: QR CODE VIEW */}
        {activeTab === 'qr' && (
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '16px',
                display: 'inline-block',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                marginBottom: '14px',
              }}
            >
              <QRCodeSVG
                id="poll-qr-svg"
                value={voteUrl}
                size={210}
                level="H"
                includeMargin={false}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={downloadQR}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
                title="Download QR code image to include in presentation slides"
              >
                <Download size={14} />
                <span>Save QR Image</span>
              </button>
              <a
                href={voteUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                <span>Open Voting Page</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: SHARE LINK VIEW */}
        {activeTab === 'link' && (
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Voting Link (Zero-login required)
            </label>
            <div
              style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '16px',
              }}
            >
              <input
                type="text"
                readOnly
                value={voteUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={copyLinkToClipboard}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Share to Apps */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                SHARE VIA APPS:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.12)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    color: '#25d366',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: '8px',
                    background: 'rgba(34, 158, 217, 0.12)',
                    border: '1px solid rgba(34, 158, 217, 0.3)',
                    color: '#229ed9',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  <Send size={18} />
                  <span>Telegram</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  <Share2 size={18} />
                  <span>Twitter/X</span>
                </a>

                <a
                  href={mailtoUrl}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#a5b4fc',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  <Mail size={18} />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Short Code PIN Banner */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>6-DIGIT JOIN PIN</div>
            <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '3px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {poll.code}
            </div>
          </div>
          <button
            type="button"
            onClick={copyPinToClipboard}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
            title="Copy PIN Code"
          >
            {copiedPin ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copiedPin ? 'PIN Copied' : 'Copy PIN'}</span>
          </button>
        </div>

        {/* Primary Action Button: Native Share / Copy */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={copyLinkToClipboard}
            className="btn-primary"
            style={{ flex: 1, padding: '12px', fontSize: '14px', gap: '8px' }}
          >
            {copiedLink ? <Check size={18} /> : <Copy size={18} />}
            <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Voting Link'}</span>
          </button>

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="btn-secondary"
              style={{ padding: '12px 16px', fontSize: '14px', gap: '6px' }}
              title="Open System Share Menu"
            >
              <Share2 size={18} />
              <span>Share...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
