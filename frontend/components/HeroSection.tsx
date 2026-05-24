import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function HeroSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError('Please paste a valid TeraBox share link.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Navigate to watch page with encoded URL
      const encoded = encodeURIComponent(url.trim());
      router.push(`/watch?url=${encoded}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <section className="hero" id="hero-input">
      {/* Background effects */}
      <div className="grid-bg" />
      <div className="orb orb-purple" style={{ top: '-100px', left: '-150px', opacity: 0.35 }} />
      <div className="orb orb-cyan" style={{ bottom: '0px', right: '-100px', opacity: 0.25 }} />

      <div className="hero-content">
        <div className="hero-badge">
          <span className="dot" />
          Now supporting 4K HDR streaming
        </div>

        <h1 className="hero-title">
          Stream Any
          <span className="line-highlight">TeraBox Video</span>
          Instantly Online
        </h1>

        <p className="hero-description">
          Paste your TeraBox share link and watch in HD or 4K — no downloads required. 
          The fastest cloud media streaming experience available.
        </p>

        {/* Input Box */}
        <div className="hero-input-wrapper">
          <div className="input-box">
            <span className="input-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 13L18 18M8 15C5.24 15 3 12.76 3 10C3 7.24 5.24 5 8 5C10.76 5 13 7.24 13 10C13 12.76 10.76 15 8 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Paste TeraBox share link here..."
              spellCheck={false}
              autoComplete="off"
            />
            <button className="paste-btn" onClick={handlePaste} type="button">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="4" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1 4H3.5V12H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Paste
            </button>
            <button
              className="watch-btn"
              onClick={() => handleSubmit()}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                    <path d="M8 2C11.31 2 14 4.69 14 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L12 8L6 12V4Z" fill="white"/>
                  </svg>
                  Watch Now
                </>
              )}
            </button>
          </div>

          {error && (
            <p style={{ color: '#FF5B5B', fontSize: '13px', marginTop: '10px', textAlign: 'left', paddingLeft: '4px' }}>
              {error}
            </p>
          )}
        </div>

        {/* Supported formats */}
        <div className="supported-formats">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4.5 6.5L6 8L8.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Supports:
          <span className="format-tag">terabox.com</span>
          <span className="format-tag">terashare.me</span>
          <span className="format-tag">1024tera.com</span>
          <span className="format-tag">terabox.app</span>
          <span className="format-tag">and more</span>
        </div>

        {/* Ad slot - banner under input */}
        <div className="ad-slot ad-slot-banner" style={{ maxWidth: '720px', margin: '20px auto 0' }}>
          Advertisement
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">50M+</span>
            <span className="stat-label">Videos Streamed</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">4K</span>
            <span className="stat-label">Max Resolution</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">&lt;1s</span>
            <span className="stat-label">Avg Load Time</span>
          </div>
        </div>
      </div>
    </section>
  );
}
