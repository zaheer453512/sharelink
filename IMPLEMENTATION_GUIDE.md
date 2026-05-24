# TeraStream — Complete Implementation Guide

## Project Structure

```
terastream/
├── frontend/                    # Next.js 14 App
│   ├── pages/
│   │   ├── index.tsx            # Homepage
│   │   ├── watch.tsx            # Video player page
│   │   ├── privacy.tsx          # Privacy Policy
│   │   ├── terms.tsx            # Terms of Service
│   │   ├── dmca.tsx             # DMCA Policy
│   │   ├── contact.tsx          # Contact Page
│   │   ├── _app.tsx             # App wrapper
│   │   └── api/
│   │       ├── resolve.ts       # Next.js API proxy → backend
│   │       └── download.ts      # Download proxy route
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive navbar
│   │   ├── HeroSection.tsx      # Hero with input
│   │   ├── FeaturesSection.tsx  # Features grid
│   │   ├── HowItWorks.tsx       # 3 steps
│   │   ├── ReviewsSection.tsx   # User reviews
│   │   ├── FAQSection.tsx       # Accordion FAQ
│   │   └── Footer.tsx           # Site footer
│   ├── styles/
│   │   └── globals.css          # All styles (Poppins, design system)
│   ├── .env.local.example       # Environment template
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
└── backend/                     # Fastify Node.js API
    ├── src/
    │   ├── server.ts            # Main server + Redis + plugins
    │   ├── routes/
    │   │   ├── resolve.ts       # POST /api/resolve
    │   │   └── download.ts      # GET /api/download + /api/health
    │   ├── services/
    │   │   └── terabox.ts       # TeraBox API + Redis cache logic
    │   └── utils/
    │       └── analytics.ts     # PostgreSQL analytics
    ├── .env.example             # Environment template
    ├── tsconfig.json
    └── package.json
```

---

## Step-by-Step Setup

### 1. Clone & Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment Variables

**Frontend — create `frontend/.env.local`:**
```env
BACKEND_URL=http://localhost:3001
INTERNAL_API_KEY=your_random_32_char_secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_key
```

**Backend — create `backend/.env`:**
```env
PORT=3001
NODE_ENV=development

# REQUIRED: Your xAPIverse API key
XAPIVERSE_API_KEY=your_private_key_here
XAPIVERSE_API_ENDPOINT=https://api.xapiverse.com/v1/terabox

# Redis (use Upstash for production)
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=43200

# PostgreSQL (use Supabase for production)
DATABASE_URL=postgresql://user:password@localhost:5432/terastream

# Must match frontend INTERNAL_API_KEY
INTERNAL_API_KEY=your_random_32_char_secret

FRONTEND_URL=http://localhost:3000
```

### 3. Start Redis Locally (Development)

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Initialize PostgreSQL Database

```sql
-- Run this in your PostgreSQL instance
CREATE DATABASE terastream;

CREATE TABLE IF NOT EXISTS request_logs (
  id BIGSERIAL PRIMARY KEY,
  url_hash VARCHAR(16) NOT NULL,
  ip_hash VARCHAR(16) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS popular_links (
  url_hash VARCHAR(16) PRIMARY KEY,
  view_count BIGINT NOT NULL DEFAULT 0,
  last_viewed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server starts on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev
# App starts on http://localhost:3000
```

---

## Production Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel

# Set environment variables in Vercel Dashboard:
# BACKEND_URL = https://your-backend.railway.app
# INTERNAL_API_KEY = your_secret
# NEXT_PUBLIC_TURNSTILE_SITE_KEY = your_key
```

### Backend → Railway

1. Push backend to a GitHub repo
2. Connect to Railway.app
3. Add environment variables in Railway dashboard
4. Deploy — Railway auto-detects Node.js

```bash
# Or deploy with Railway CLI
railway login
railway init
railway up
```

### Redis → Upstash

1. Create account at upstash.com
2. Create a Redis database
3. Copy the Redis URL (starts with `rediss://`)
4. Set `REDIS_URL=rediss://...` in backend environment

### Database → Supabase

1. Create project at supabase.com
2. Go to Settings → Database → Connection String
3. Set `DATABASE_URL=postgresql://...` in backend environment
4. Run the SQL schema from Step 4 above in Supabase SQL Editor

---

## Adding Your API Key (xAPIverse)

1. Sign up at xAPIverse (or your TeraBox API provider)
2. Get your API key
3. Add to backend `.env`:
   ```
   XAPIVERSE_API_KEY=your_actual_key_here
   ```
4. The key is **ONLY** used in `backend/src/services/terabox.ts`
5. It is **NEVER** sent to the frontend

---

## Caching Flow

```
User submits TeraBox URL
         ↓
Generate SHA-256 hash of URL
         ↓
Check Redis: key = terastream:resolve:{hash}
         ↓
   ┌─────┴──────┐
Cache Hit      Cache Miss
   ↓               ↓
Return cached   Call xAPIverse API
response        with XAPIVERSE_API_KEY
                    ↓
                Normalize response
                    ↓
                Save to Redis (12h TTL)
                    ↓
                Return response
```

---

## Video.js Integration

The watch page uses Video.js loaded dynamically (to avoid SSR issues):

```typescript
const videojs = (await import('video.js')).default;
```

**Supported stream types:**
- HLS (`.m3u8`) — primary
- MP4 direct — fallback
- Adaptive bitrate via VHS plugin (built into Video.js 8+)

**Add quality selector plugin:**
```bash
npm install videojs-resolution-switcher
```

---

## Ad Integration

Ad slots are pre-placed in the HTML with CSS class `ad-slot`:

| Location | Class | Size |
|----------|-------|------|
| Hero (below input) | `.ad-slot-banner` | 728×90 |
| Above player | `.ad-slot-banner` | 728×90 |
| Below metadata | `.ad-slot-banner` | 728×90 |
| FAQ top/bottom | `.ad-slot-banner` | 728×90 |

**To activate Google AdSense:**
```html
<!-- Add to _document.tsx <Head> -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossOrigin="anonymous"></script>
```

Replace `<div className="ad-slot ad-slot-banner">Advertisement</div>` with:
```html
<ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" />
```

---

## Cloudflare Turnstile CAPTCHA

Install:
```bash
npm install @marsidev/react-turnstile
```

Add to `HeroSection.tsx` before the Watch button:
```tsx
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
/>
```

Pass token to backend in resolve request and verify server-side.

---

## SEO Checklist

- ✅ Unique title & description on every page
- ✅ `<meta name="robots" content="noindex">` on watch pages
- ✅ Open Graph tags on homepage
- ✅ FAQ section for long-tail keywords
- ✅ Features section with keyword-rich content
- ✅ Semantic HTML headings (H1 → H2 → H3)
- ✅ Privacy, Terms, DMCA, Contact, About pages
- ✅ Clean URL structure (/watch, /privacy, etc.)

---

## Security Checklist

- ✅ API keys only in server-side `.env` files
- ✅ INTERNAL_API_KEY authenticates Next.js → Backend calls
- ✅ Helmet.js security headers on all routes
- ✅ Rate limiting (60 req/min per IP via Redis)
- ✅ Input validation on all API routes
- ✅ URL validation — only accepted TeraBox domains
- ✅ Download URL proxied — users never see raw upstream URLs
- ✅ CORS restricted to frontend URL only
- ✅ TypeScript strict mode on both frontend and backend

---

## Performance Checklist

- ✅ Redis caching (12h TTL — configurable)
- ✅ Next.js SSR + static optimization
- ✅ Lazy-loaded Video.js (dynamic import)
- ✅ CSS-only animations (no heavy animation libraries)
- ✅ SVG icons instead of icon font packages
- ✅ next/image for optimized images
- ✅ Gzip compression via Fastify
- ✅ Vercel Edge Network (CDN)

---

## Scaling (Phase 3)

When traffic grows:

```bash
# Docker Compose for local multi-service
docker-compose up -d redis postgres backend frontend

# Scale backend horizontally on Railway
railway scale --replicas 3

# Or move to Hetzner VPS + Docker + Nginx
# nginx.conf: upstream backend { server backend:3001; }
```

Redis handles session state so multiple backend instances work seamlessly.
