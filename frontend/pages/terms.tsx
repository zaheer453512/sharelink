import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — TeraStream</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <main style={{ minHeight: '100vh', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="section-tag" style={{ marginBottom: '16px' }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          {[
            { title: '1. Acceptance of Terms', content: 'By accessing and using TeraStream, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.' },
            { title: '2. Service Description', content: 'TeraStream is a cloud media streaming interface that allows users to stream and download files from TeraBox cloud storage via share links. We do not host any content.' },
            { title: '3. Acceptable Use', content: 'You agree to use TeraStream only for lawful purposes. You must not use the service to stream or download content that violates copyright law, contains illegal material, or infringes on third-party rights. Automated scraping, bot usage, or API abuse is strictly prohibited.' },
            { title: '4. Rate Limiting', content: 'To ensure fair usage for all users, TeraStream implements rate limiting. Excessive automated requests may result in temporary access restriction.' },
            { title: '5. Disclaimer of Warranties', content: 'TeraStream is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, and we are not responsible for the availability or content of files on TeraBox\'s infrastructure.' },
            { title: '6. Limitation of Liability', content: 'TeraStream shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to loss of data or service interruptions.' },
            { title: '7. Changes to Terms', content: 'We reserve the right to modify these Terms at any time. Continued use of TeraStream after changes constitutes acceptance of the new Terms.' },
            { title: '8. Governing Law', content: 'These Terms shall be governed by applicable law. Any disputes shall be resolved through binding arbitration.' },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{s.title}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '15px' }}>{s.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
