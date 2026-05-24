import { useState } from 'react';

const steps = [
  {
    n: '1',
    title: 'Paste Your Link',
    desc: 'Copy any TeraBox share URL and paste it into the input field on our homepage. All TeraBox domains are supported.',
  },
  {
    n: '2',
    title: 'We Process It',
    desc: 'Our backend securely retrieves the streaming URL, file metadata, and available quality options via our protected API.',
  },
  {
    n: '3',
    title: 'Watch & Enjoy',
    desc: 'Stream in HD or 4K instantly in your browser, or download the file directly — no account needed, no waiting.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="orb orb-purple" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)', opacity: 0.18 }} />
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
          <p className="section-subtitle">No sign-up required. No software to install. Just paste and play instantly.</p>
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
