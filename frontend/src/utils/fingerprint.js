// Generates a lightweight, client-side browser fingerprint
export function getBrowserFingerprint() {
  const cached = localStorage.getItem('syncpoll_voter_fp');
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasHash = 'no-canvas';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SyncPoll-Voter-Guard', 2, 15);
    canvasHash = canvas.toDataURL();
  }

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasHash.slice(-50),
  ].join('###');

  // Simple string hashing
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  const fp = 'fp_' + Math.abs(hash).toString(36) + Math.random().toString(36).substring(2, 7);
  localStorage.setItem('syncpoll_voter_fp', fp);
  return fp;
}
