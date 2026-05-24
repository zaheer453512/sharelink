import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DMCA() {
  return (
    <>
      <Head>
        <title>DMCA Policy — TeraStream</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Navbar />
      <main style={{ minHeight: '100vh', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="section-tag" style={{ marginBottom: '16px' }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>DMCA Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          {[
            { title: 'No Content Hosting', content: 'TeraStream does not host, store, upload, or distribute any video files or copyrighted content. Our platform functions solely as a media player and link resolver that interfaces with TeraBox\'s own cloud infrastructure. All files remain on TeraBox\'s servers.' },
            { title: 'DMCA Takedown Requests', content: 'If you are a copyright owner or authorized agent and believe content accessible through our platform infringes your copyright, please send a written notice to our contact email including: (1) Your contact information, (2) Identification of the copyrighted work, (3) The URL of the infringing content, (4) A statement of good faith belief, (5) A statement of accuracy under penalty of perjury, and (6) Your physical or electronic signature.' },
            { title: 'Counter-Notifications', content: 'If you believe your content was removed in error, you may send a counter-notification with your contact information, identification of the removed material, and a statement under penalty of perjury that the removal was made in error.' },
            { title: 'Repeat Infringers', content: 'TeraStream will terminate access for users who repeatedly infringe copyright in accordance with the DMCA.' },
            { title: 'Direct Your Request to TeraBox', content: 'Since TeraStream does not host files, we strongly encourage copyright holders to direct takedown requests directly to TeraBox (Flextech Inc.) who hosts and controls the actual content.' },
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
