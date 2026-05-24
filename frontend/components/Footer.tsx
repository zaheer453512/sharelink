import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="nav-logo-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                </svg>
              </div>
              TeraStream
            </div>
            <p className="footer-tagline">
              The fastest cloud video streaming platform. Stream any TeraBox video instantly in HD or 4K — no account needed.
            </p>
            <div className="footer-socials">
              {[
                { label: 'Twitter', d: 'M13.5 2L8.5 7.5L13.5 13H10.5L7.5 9.5L4.5 13H1.5L6.5 7.5L1.5 2H4.5L7.5 5.5L10.5 2H13.5Z' },
                { label: 'Telegram', d: 'M13.5 1.5L1.5 6L6 7.5L8 13.5L10.5 10L13.5 1.5Z' },
              ].map((s, i) => (
                <a key={i} href="#" className="social-btn" aria-label={s.label}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d={s.d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><Link href="#features">Features</Link></li>
              <li><Link href="#how-it-works">How It Works</Link></li>
              <li><Link href="#faq">FAQ</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/dmca">DMCA Policy</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Supported</h4>
            <ul className="footer-links">
              <li><a href="#">terabox.com</a></li>
              <li><a href="#">terashare.me</a></li>
              <li><a href="#">1024tera.com</a></li>
              <li><a href="#">terabox.app</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} TeraStream. All rights reserved. Not affiliated with TeraBox or Flextech Inc.</p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/dmca">DMCA</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
