// HowItWorks Component
const steps = [
  {
    n: '1',
    title: 'Paste Your Link',
    desc: 'Copy any TeraBox share URL and paste it into the input field on our homepage. All TeraBox domains are supported.',
  },
  {
    n: '2',
    title: 'We Process It',
    desc: 'Our backend securely retrieves the streaming URL, file metadata, and available quality options via our API.',
  },
  {
    n: '3',
    title: 'Watch & Enjoy',
    desc: 'Stream in HD or 4K instantly in your browser, or download the file directly — no account needed.',
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="orb orb-purple" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)', opacity: 0.2 }} />
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6.5 3.5V6.5L8.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Simple Process
          </div>
          <h2 className="section-title">Stream in <span>3 Easy Steps</span></h2>
          <p className="section-subtitle">
            No sign-up required. No software to install. Just paste and play.
          </p>
        </div>

        <div className="steps-grid">
          <div className="steps-connector" />
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ReviewsSection Component
const reviews = [
  {
    stars: 5,
    text: 'Absolutely amazing platform. I can stream my TeraBox videos directly without any buffering. The 4K quality is outstanding!',
    name: 'Ahmad Raza',
    role: 'Content Creator',
    avatar: '#6C47FF',
    initial: 'A',
  },
  {
    stars: 5,
    text: 'Finally a tool that actually works! Super fast, clean interface, and the download feature saved me so much time.',
    name: 'Sara Khan',
    role: 'Digital Designer',
    avatar: '#00C4AC',
    initial: 'S',
  },
  {
    stars: 5,
    text: 'The subtitle support is incredible. I watch international content daily and this makes it so much easier. Highly recommend!',
    name: 'Omar Farooq',
    role: 'Film Enthusiast',
    avatar: '#FF6B6B',
    initial: 'O',
  },
  {
    stars: 5,
    text: 'Works perfectly on mobile. The adaptive streaming adjusts to my connection automatically. No buffering at all!',
    name: 'Fatima Malik',
    role: 'Student',
    avatar: '#FFB800',
    initial: 'F',
  },
  {
    stars: 5,
    text: 'I use this daily for my cloud-stored lecture videos. The speed is unreal — loads in under a second every time.',
    name: 'Hassan Ali',
    role: 'University Lecturer',
    avatar: '#8B6FFF',
    initial: 'H',
  },
  {
    stars: 4,
    text: 'Clean, fast, and no annoying popups. The best TeraBox streaming tool I have found. The UI is just beautiful.',
    name: 'Zara Hussain',
    role: 'Tech Blogger',
    avatar: '#00C4AC',
    initial: 'Z',
  },
];

export function ReviewsSection() {
  return (
    <section className="reviews" id="reviews">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1L8.1 4.7L12 5.3L9.2 8L9.9 12L6.5 10.2L3.1 12L3.8 8L1 5.3L4.9 4.7L6.5 1Z" fill="currentColor"/>
            </svg>
            User Reviews
          </div>
          <h2 className="section-title">Loved by <span>Thousands of Users</span></h2>
          <p className="section-subtitle">
            Join millions of users who stream their cloud videos with TeraStream every day.
          </p>
        </div>

        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div className="review-card" key={i}>
              <div className="stars">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="star-icon" width="16" height="16" viewBox="0 0 16 16" fill={j < r.stars ? '#FFB800' : 'none'} stroke={j < r.stars ? 'none' : '#FFB800'} strokeWidth="1.2">
                    <path d="M8 1L10.09 5.26L14.85 5.97L11.42 9.31L12.18 14.09L8 11.91L3.82 14.09L4.58 9.31L1.15 5.97L5.91 5.26L8 1Z"/>
                  </svg>
                ))}
              </div>
              <p className="review-text">"{r.text}"</p>
              <div className="reviewer">
                <div className="reviewer-avatar" style={{ background: r.avatar }}>{r.initial}</div>
                <div className="reviewer-info">
                  <div className="name">{r.name}</div>
                  <div className="role">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQSection Component
const faqs = [
  {
    q: 'What is TeraStream and how does it work?',
    a: 'TeraStream is a cloud video streaming platform that lets you watch TeraBox-hosted videos directly in your browser. Simply paste your TeraBox share link, and our system retrieves the streaming URL so you can watch instantly — no downloads or accounts needed.',
  },
  {
    q: 'Which TeraBox link formats are supported?',
    a: 'We support all TeraBox-related share domains including terabox.com, terashare.me, 1024tera.com, terabox.app, and various regional variants. Short links and redirected share URLs are also supported.',
  },
  {
    q: 'Is streaming free? Are there any limitations?',
    a: 'Yes, streaming is completely free. There are no account requirements. For very high-traffic usage, rate limiting may apply to ensure fair usage for all users.',
  },
  {
    q: 'What video quality can I expect?',
    a: 'We support up to 4K HDR quality depending on the source file. Our adaptive HLS streaming automatically selects the best quality for your connection speed — you can also manually choose quality levels in the player.',
  },
  {
    q: 'Can I download files using TeraStream?',
    a: 'Yes! Every file has a direct download button below the player. Our proxy-based download system provides fast, reliable downloads with URL protection for your security.',
  },
  {
    q: 'Are subtitles supported?',
    a: 'Yes, we support both SRT and VTT subtitle formats. Available subtitle tracks are automatically loaded in the player, with multi-language support and synchronization controls.',
  },
  {
    q: 'Is my data safe and private?',
    a: 'Absolutely. We never store your TeraBox links or personal data. All API communication is secured on the backend, API keys are never exposed publicly, and we use Cloudflare for DDoS protection.',
  },
  {
    q: 'Do you support mobile devices?',
    a: 'Yes! TeraStream is fully responsive and optimized for all screen sizes including smartphones and tablets. The video player supports native fullscreen and touch controls on mobile.',
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 5C5 4.17 5.67 3.5 6.5 3.5C7.33 3.5 8 4.17 8 5C8 5.83 6.5 6.5 6.5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="6.5" cy="9" r="0.6" fill="currentColor"/>
            </svg>
            FAQ
          </div>
          <h2 className="section-title">Frequently Asked <span>Questions</span></h2>
          <p className="section-subtitle">
            Everything you need to know about TeraStream. Can't find your answer? Contact us.
          </p>
        </div>

        {/* Ad slot in FAQ */}
        <div className="ad-slot ad-slot-banner" style={{ maxWidth: '760px', margin: '0 auto 32px' }}>
          Advertisement
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className={`faq-item ${openIdx === i ? 'open' : ''}`} key={i}>
              <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                {f.q}
                <div className="faq-chevron">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              {openIdx === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>

        {/* Ad slot between FAQ */}
        <div className="ad-slot ad-slot-banner" style={{ maxWidth: '760px', margin: '32px auto 0' }}>
          Advertisement
        </div>
      </div>
    </section>
  );
}

// Footer Component
export function Footer() {
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
              <a href="#" className="social-btn" aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M13.5 2L8.5 7.5L13.5 13H10.5L7.5 9.5L4.5 13H1.5L6.5 7.5L1.5 2H4.5L7.5 5.5L10.5 2H13.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" className="social-btn" aria-label="Telegram">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M13.5 1.5L1.5 6L6 7.5L8 13.5L10.5 10L13.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 7.5L8.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </a>
              <a href="#" className="social-btn" aria-label="YouTube">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1.5" y="3.5" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M6.5 5.5L9.5 7.5L6.5 9.5V5.5Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="/about">About Us</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/dmca">DMCA Policy</a></li>
              <li><a href="/contact">Contact</a></li>
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
          <p className="footer-copy">© {new Date().getFullYear()} TeraStream. All rights reserved. Not affiliated with TeraBox.</p>
          <div className="footer-legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/dmca">DMCA</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
export default HowItWorks;
