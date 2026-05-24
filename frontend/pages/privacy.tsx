import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — TeraStream</title>
        <meta name="description" content="TeraStream Privacy Policy — How we handle your data." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <main style={{ minHeight: '100vh', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div className="section-tag" style={{ marginBottom: '16px' }}>Legal</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {[
            { title: '1. Information We Collect', content: 'TeraStream does not require account creation and does not collect personally identifiable information. We may collect anonymized usage data such as hashed IP addresses and hashed URL identifiers solely for performance analytics, abuse prevention, and service improvement. We do not store raw TeraBox share links or personal identifiers.' },
            { title: '2. How We Use Information', content: 'Anonymized data is used to monitor platform health, detect abuse, improve cache performance, and understand aggregate usage patterns. We do not sell, rent, or share any collected data with third parties for marketing purposes.' },
            { title: '3. Cookies', content: 'TeraStream uses only essential cookies necessary for site functionality such as session management. We do not use tracking cookies or third-party analytics cookies beyond what advertising partners may place independently.' },
            { title: '4. Third-Party Services', content: 'We use Cloudflare for DDoS protection and CDN services. Advertisement networks may be integrated for monetization. These third parties have their own privacy policies. API calls to external services are made server-side; your browser does not directly contact TeraBox APIs.' },
            { title: '5. Data Security', content: 'All API keys and sensitive credentials are stored server-side and never exposed to clients. HTTPS encryption is enforced for all connections. Rate limiting and Cloudflare protection help prevent unauthorized access.' },
            { title: '6. DMCA & Content', content: 'TeraStream does not host, store, or distribute any video files. We act as a media player interface that resolves streaming URLs from TeraBox\'s own infrastructure. If you believe content infringes your rights, please contact us or refer to our DMCA Policy.' },
            { title: '7. Changes to This Policy', content: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of TeraStream constitutes acceptance of the updated policy.' },
            { title: '8. Contact', content: 'For privacy-related inquiries, please contact us through our Contact page.' },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{section.title}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '15px' }}>{section.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
