import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send — replace with actual email API
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  };

  return (
    <>
      <Head>
        <title>Contact — TeraStream</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <main style={{ minHeight: '100vh', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="section-tag" style={{ marginBottom: '16px' }}>Get in Touch</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>Contact Us</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '15px', lineHeight: '1.7' }}>
            Have a question, DMCA request, or just want to say hello? Fill in the form below and we'll get back to you.
          </p>

          {sent ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: '0 auto' }}>
                  <circle cx="28" cy="28" r="26" fill="rgba(0,229,200,0.15)" stroke="#00E5C8" strokeWidth="1.5"/>
                  <path d="M18 28L25 35L38 21" stroke="#00E5C8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Message Sent!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Subject', key: 'subject', type: 'text', placeholder: 'What is this about?' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required
                    style={{
                      width: '100%', padding: '13px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'var(--font)',
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message..."
                  required
                  rows={5}
                  style={{
                    width: '100%', padding: '13px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'var(--font)',
                    resize: 'vertical', minHeight: '140px', transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
