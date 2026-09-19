<p align="center">
  <svg width="1400" height="240" viewBox="0 0 1400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SyncPoll banner">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#070b1a"/>
        <stop offset="35%" stop-color="#111a33"/>
        <stop offset="100%" stop-color="#0d1224"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" x2="1">
        <stop offset="0%" stop-color="#00d4ff"/>
        <stop offset="100%" stop-color="#7c3aed"/>
      </linearGradient>
      <linearGradient id="glow" x1="0" x2="1">
        <stop offset="0%" stop-color="#7ef9ff"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="1400" height="240" rx="24" fill="url(#bg)"/>

    <circle cx="1100" cy="90" r="120" fill="url(#accent)" opacity="0.12"/>
    <circle cx="1240" cy="155" r="90" fill="#00d4ff" opacity="0.08"/>
    <circle cx="220" cy="180" r="150" fill="#7c3aed" opacity="0.10"/>

    <g opacity="0.16">
      <path d="M120 170L260 90L350 155L500 60L610 130L760 30L870 130L990 80L1100 155L1230 70L1320 150" stroke="url(#glow)" stroke-width="3" fill="none"/>
      <path d="M80 80C170 50 210 140 300 115C390 90 430 35 530 70C620 105 690 200 820 155C970 105 980 40 1090 58C1190 75 1260 150 1330 126" stroke="#00d4ff" stroke-width="2" fill="none" opacity="0.9"/>
    </g>

    <g transform="translate(70 45)">
      <rect x="0" y="0" width="149" height="149" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)"/>
      <rect x="26" y="26" width="97" height="97" rx="18" fill="url(#accent)" opacity="0.9" filter="url(#softGlow)"/>
      <path d="M53 89L72 53L83 72L97 61L116 92H53Z" fill="#ffffff" opacity="0.95"/>
      <circle cx="97" cy="58" r="5" fill="#ffffff"/>
      <path d="M45 113H102" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
    </g>

    <g>
      <text x="255" y="104" font-size="56" font-weight="700" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif">SyncPoll</text>
      <text x="255" y="146" font-size="22" font-weight="500" fill="#A5B4FC" font-family="Segoe UI, Arial, sans-serif">Real-time audience polling • live decision making</text>
      <rect x="255" y="170" width="250" height="8" rx="4" fill="url(#accent)" opacity="0.9"/>
      <text x="255" y="207" font-size="18" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif">React • Go • Redis • MongoDB</text>
    </g>

    <g transform="translate(1010 40)">
      <rect x="0" y="0" width="240" height="123" rx="18" fill="rgba(15,23,42,0.45)" stroke="rgba(255,255,255,0.12)"/>
      <text x="24" y="36" font-size="14" fill="#7DD3FC" font-family="Segoe UI, Arial, sans-serif">Live audience pulse</text>
      <text x="24" y="72" font-size="40" font-weight="700" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif">96%</text>
      <text x="24" y="95" font-size="14" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif">engagement spike</text>
      <path d="M156 88L176 70L194 76L210 54" stroke="#7ef9ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="156" cy="88" r="5" fill="#7ef9ff"/>
      <circle cx="176" cy="70" r="5" fill="#7ef9ff"/>
      <circle cx="194" cy="76" r="5" fill="#7ef9ff"/>
      <circle cx="210" cy="54" r="5" fill="#7ef9ff"/>
    </g>
  </svg>
</p>

# SyncPoll
