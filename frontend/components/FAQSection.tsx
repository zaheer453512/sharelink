import { useState } from 'react';

const faqs = [
  { q: 'What is TeraStream and how does it work?', a: 'TeraStream is a cloud video streaming platform that lets you watch TeraBox-hosted videos directly in your browser. Simply paste your TeraBox share link, and our system retrieves the streaming URL so you can watch instantly — no downloads or accounts needed.' },
  { q: 'Which TeraBox link formats are supported?', a: 'We support all TeraBox-related share domains including terabox.com, terashare.me, 1024tera.com, terabox.app, and various regional variants. Short links and redirected share URLs are also dynamically supported.' },
  { q: 'Is streaming free? Are there any limitations?', a: 'Yes, streaming is completely free. There are no account requirements. For very high-traffic usage, rate limiting may apply to ensure fair usage for all users on the platform.' },
  { q: 'What video quality can I expect?', a: 'We support up to 4K HDR quality depending on the source file. Our adaptive HLS streaming automatically selects the best quality for your connection speed — you can also manually choose quality levels in the player settings.' },
  { q: 'Can I download files using TeraStream?', a: 'Yes! Every file has a direct download button below the player. Our proxy-based download system provides fast, reliable downloads with URL protection and download analytics.' },
  { q: 'Are subtitles supported?', a: 'Yes, we support both SRT and VTT subtitle formats. Available subtitle tracks are automatically loaded in the player, with multi-language support and synchronization controls built in.' },
  { q: 'Is my data safe and private?', a: 'Absolutely. We never store your TeraBox links or personal data. All API communication is secured on the backend, API keys are never exposed publicly, and we use Cloudflare for DDoS and bot protection.' },
  { q: 'Do you support mobile devices?', a: 'Yes! TeraStream is fully responsive and optimized for all screen sizes including smartphones and tablets. The video player supports native fullscreen and touch controls on all mobile devices.' },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="faq" id="faq" style={{ paddingBottom: '120px' }}>
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
          <p className="section-subtitle">Everything you need to know about TeraStream. Can't find your answer? Contact us.</p>
        </div>

        <div className="ad-slot ad-slot-banner" style={{ maxWidth: '760px', margin: '0 auto 32px' }}>Advertisement</div>

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

        <div className="ad-slot ad-slot-banner" style={{ maxWidth: '760px', margin: '32px auto 0' }}>Advertisement</div>
      </div>
    </section>
  );
}
