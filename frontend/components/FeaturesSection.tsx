const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 3L19 12L5 21V3Z" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '4K HDR Streaming',
    desc: 'Experience crystal-clear video quality with adaptive bitrate streaming up to 4K resolution. Smooth playback guaranteed on any device.',
    badge: 'HD Ready',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'HLS Adaptive Playback',
    desc: 'Smart adaptive streaming automatically adjusts quality based on your connection speed — zero buffering, always smooth.',
    badge: 'Auto Quality',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7 10 12 15 17 10" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Direct Downloads',
    desc: 'Download files instantly with our high-speed proxy download system. Protected URLs with no redirects or ads.',
    badge: 'Fast Download',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="#6C47FF" strokeWidth="2"/>
        <path d="M8 21H16M12 17V21" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 8.5L11 11L7 13.5V8.5Z" fill="#6C47FF"/>
      </svg>
    ),
    title: 'Subtitle Support',
    desc: 'Automatic subtitle detection with support for SRT and VTT formats. Multi-language support with sync controls.',
    badge: 'Multi-Lang',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6C47FF" strokeWidth="2"/>
        <path d="M12 8V12L15 15" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Redis Cache System',
    desc: 'Intelligent caching layer prevents repeated API calls. Blazing fast response times for popular content.',
    badge: '12h Cache',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="#6C47FF" strokeWidth="2"/>
        <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1.5" fill="#6C47FF"/>
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'All API keys are backend-only. Rate limiting, Cloudflare protection, and CAPTCHA keep your experience safe.',
    badge: 'Protected',
  },
];

export default function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1L8.1 4.7L12 5.3L9.2 8L9.9 12L6.5 10.2L3.1 12L3.8 8L1 5.3L4.9 4.7L6.5 1Z" fill="currentColor"/>
            </svg>
            Platform Features
          </div>
          <h2 className="section-title">Everything You Need to <span>Stream Perfectly</span></h2>
          <p className="section-subtitle">
            Built with modern technology stack for speed, reliability, and an exceptional viewing experience across all devices.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feature-badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M3 5L4.5 6.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f.badge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
