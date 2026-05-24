const reviews = [
  { stars: 5, text: 'Absolutely amazing platform. I can stream my TeraBox videos directly without any buffering. The 4K quality is outstanding!', name: 'Ahmad Raza', role: 'Content Creator', avatar: '#6C47FF', initial: 'A' },
  { stars: 5, text: 'Finally a tool that actually works! Super fast, clean interface, and the download feature saved me so much time.', name: 'Sara Khan', role: 'Digital Designer', avatar: '#00C4AC', initial: 'S' },
  { stars: 5, text: 'The subtitle support is incredible. I watch international content daily and this makes it so much easier. Highly recommend!', name: 'Omar Farooq', role: 'Film Enthusiast', avatar: '#FF6B6B', initial: 'O' },
  { stars: 5, text: 'Works perfectly on mobile. The adaptive streaming adjusts to my connection automatically. No buffering at all!', name: 'Fatima Malik', role: 'Student', avatar: '#FFB800', initial: 'F' },
  { stars: 5, text: 'I use this daily for my cloud-stored lecture videos. The speed is unreal — loads in under a second every time.', name: 'Hassan Ali', role: 'University Lecturer', avatar: '#8B6FFF', initial: 'H' },
  { stars: 4, text: 'Clean, fast, and no annoying popups. The best TeraBox streaming tool I have found. The UI is just beautiful.', name: 'Zara Hussain', role: 'Tech Blogger', avatar: '#00C4AC', initial: 'Z' },
];

export default function ReviewsSection() {
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
          <p className="section-subtitle">Join millions of users who stream their cloud videos with TeraStream every day.</p>
        </div>

        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div className="review-card" key={i}>
              <div className="stars">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill={j < r.stars ? '#FFB800' : 'none'} stroke={j < r.stars ? 'none' : '#64748B'} strokeWidth="1.2">
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
