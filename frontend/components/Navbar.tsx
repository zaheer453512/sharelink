import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              </svg>
            </div>
            TeraStream
          </Link>

          <ul className="nav-links">
            <li><Link href="#features">Features</Link></li>
            <li><Link href="#how-it-works">How It Works</Link></li>
            <li><Link href="#faq">FAQ</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>

          <div className="nav-actions">
            <Link href="#hero-input" className="nav-links nav-cta">
              Stream Now
            </Link>
          </div>

          <button
            className="hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <Link href="#features" onClick={() => setMobileOpen(false)}>Features</Link>
        <Link href="#how-it-works" onClick={() => setMobileOpen(false)}>How It Works</Link>
        <Link href="#faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
        <Link href="/about" onClick={() => setMobileOpen(false)}>About</Link>
        <Link href="/privacy" onClick={() => setMobileOpen(false)}>Privacy Policy</Link>
        <Link href="/terms" onClick={() => setMobileOpen(false)}>Terms of Service</Link>
      </div>
    </>
  );
}
