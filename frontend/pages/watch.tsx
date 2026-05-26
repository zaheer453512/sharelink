import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

<<<<<<< HEAD
interface Quality { label: string; url: string; }
interface Subtitle { label: string; lang: string; url: string; }
=======
// ─── Types ───────────────────────────────────────────────────────────────────

interface Quality {
  label: string;
  url: string;
}

interface Subtitle {
  label: string;
  lang: string;
  url: string;
}

>>>>>>> ad5d9b3 (jinnah)
interface FileData {
  title: string;
  size: string;
  resolution: string;
  duration: string;
  thumbnail: string;
  streamUrl: string;
  qualities?: Quality[];
  downloadUrl: string;
  subtitles?: Subtitle[];
<<<<<<< HEAD
}

// Constants
const SEEK_SECONDS = 10;
const DOUBLE_TAP_DELAY = 280;
const MAX_RETRIES = 2;

function getMimeType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8')) return 'application/x-mpegURL';
  if (lower.includes('.mpd')) return 'application/dash+xml';
  if (lower.includes('.webm')) return 'video/webm';
  return 'video/mp4';
}

function getProxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
=======
>>>>>>> ad5d9b3 (jinnah)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEEK_SECONDS = 10;
const DOUBLE_TAP_DELAY = 280; // ms window for double-tap detection
const QUALITY_LABELS = ['Auto', '360p', '480p', '720p'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMimeType(url: string): string {
  if (url.includes('.m3u8')) return 'application/x-mpegURL';
  if (url.includes('.mpd')) return 'application/dash+xml';
  if (url.includes('.webm')) return 'video/webm';
  return 'video/mp4';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WatchPage() {
  const router = useRouter();
  const { url } = router.query;
<<<<<<< HEAD

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferPct, setBufferPct] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [manualQuality, setManualQuality] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const tapSideRef = useRef<'left' | 'right' | null>(null);

  // Fetch Metadata
=======

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);   // Video.js mount point
  const wrapperRef   = useRef<HTMLDivElement>(null);   // Outer touch wrapper
  const playerRef    = useRef<any>(null);

  // Page state
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Buffer overlay state
  const [isBuffering,  setIsBuffering]  = useState(false);
  const [bufferPct,    setBufferPct]    = useState(0);

  // Quality selector state
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu,  setShowQualityMenu] = useState(false);
  const [manualQuality,   setManualQuality]   = useState(false); // user has overridden auto

  // Internal double-tap refs (avoids re-renders)
  const tapTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef    = useRef(0);
  const tapSideRef     = useRef<'left' | 'right' | null>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  // ─── 1. Fetch video metadata ────────────────────────────────────────────────
>>>>>>> ad5d9b3 (jinnah)
  useEffect(() => {
    if (!url) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setRetryCount(0);
      try {
        const res = await fetch('/api/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: decodeURIComponent(url as string) }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: FileData = await res.json();
<<<<<<< HEAD
        if (!data?.streamUrl) throw new Error('No stream URL');
=======
        if (!data?.streamUrl) throw new Error('No stream URL returned from server.');
>>>>>>> ad5d9b3 (jinnah)
        setFileData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

<<<<<<< HEAD
  // Outside click for quality menu
=======
  // ─── 2. Refresh stream URL ──────────────────────────────────────────────────
  const refreshStream = useCallback(async (): Promise<string | null> => {
    if (!url) return null;
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: decodeURIComponent(url as string) }),
      });
      const data: FileData = await res.json();
      return data?.streamUrl ?? null;
    } catch {
      return null;
    }
  }, [url]);

  // ─── 3. Close quality menu on outside click ─────────────────────────────────
>>>>>>> ad5d9b3 (jinnah)
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

<<<<<<< HEAD
  // Initialize Player
=======
  // ─── 4. Initialize Video.js ─────────────────────────────────────────────────
>>>>>>> ad5d9b3 (jinnah)
  useEffect(() => {
    if (!fileData || !containerRef.current) return;

    let destroyed = false;
<<<<<<< HEAD
    let stallTimer: NodeJS.Timeout | null = null;
=======
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
>>>>>>> ad5d9b3 (jinnah)

    const initPlayer = async () => {
      const { default: videojs } = await import('video.js');
      if (destroyed) return;
<<<<<<< HEAD

      if (playerRef.current) playerRef.current.dispose();

=======

      // Dispose previous player
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }

      // Mount fresh <video> element
>>>>>>> ad5d9b3 (jinnah)
      containerRef.current!.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.className = 'video-js vjs-big-play-centered';
      videoEl.setAttribute('controls', '');
<<<<<<< HEAD
      videoEl.setAttribute('preload', 'metadata');
      videoEl.setAttribute('playsinline', '');
      if (fileData.thumbnail) videoEl.setAttribute('poster', fileData.thumbnail);

      containerRef.current!.appendChild(videoEl);

      const sources = fileData.qualities?.length
        ? fileData.qualities.map(q => ({
            src: getProxyUrl(q.url),
            type: getMimeType(q.url),
            label: q.label
          }))
        : [{ src: getProxyUrl(fileData.streamUrl), type: getMimeType(fileData.streamUrl) }];
=======
      videoEl.setAttribute('preload', 'auto');
      videoEl.setAttribute('playsinline', '');
      if (fileData.thumbnail) videoEl.setAttribute('poster', fileData.thumbnail);
      containerRef.current!.appendChild(videoEl);

      const sources = fileData.qualities?.length
        ? fileData.qualities.map((q) => ({ src: q.url, type: getMimeType(q.url), label: q.label }))
        : [{ src: fileData.streamUrl, type: getMimeType(fileData.streamUrl) }];

      const tracks = Array.isArray(fileData.subtitles)
        ? fileData.subtitles
            .filter((s) => s?.url && s?.lang)
            .map((s) => ({ kind: 'subtitles' as const, src: s.url, srclang: s.lang, label: s.label }))
        : [];
>>>>>>> ad5d9b3 (jinnah)

      playerRef.current = videojs(videoEl, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
<<<<<<< HEAD
            overrideNative: false,           // ← Most important for stability
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
          },
        },
        sources,
=======
            overrideNative: true,
            enableLowInitialPlaylist: true,   // start with low quality on slow net
            smoothQualityChange: true,
            bandwidth: 500000,                 // initial bandwidth estimate
            limitRenditionByPlayerDimensions: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        sources,
        tracks,
>>>>>>> ad5d9b3 (jinnah)
      });

      const player = playerRef.current;

<<<<<<< HEAD
      const updateBuffer = () => {
        const vid = player.el()?.querySelector('video') as HTMLVideoElement;
        if (!vid?.buffered?.length || !vid.duration) return;
=======
      // ── Buffer tracking ──
      const updateBuffer = () => {
        if (destroyed) return;
        const vid = player.el()?.querySelector('video') as HTMLVideoElement | null;
        if (!vid || !vid.buffered.length || !vid.duration) return;
>>>>>>> ad5d9b3 (jinnah)
        const pct = Math.round((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
        setBufferPct(Math.min(pct, 100));
      };

<<<<<<< HEAD
      player.on('waiting', () => setIsBuffering(true));
      player.on('playing', () => setIsBuffering(false));
      player.on('canplay', () => setIsBuffering(false));
      player.on('progress', updateBuffer);

      // Controlled Stall Recovery
      player.on('stalled', () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          if (retryCount < MAX_RETRIES && !destroyed) {
            player.play().catch(() => {});
            setRetryCount(prev => prev + 1);
          }
        }, 1500);
      });

      // Error Handling
      player.on('error', async () => {
        if (retryCount >= MAX_RETRIES) return;
        const freshUrl = await refreshStream();
        if (freshUrl) {
          player.src({ src: getProxyUrl(freshUrl), type: getMimeType(freshUrl) });
          player.load();
          setRetryCount(prev => prev + 1);
        }
      });
    };

    initPlayer().catch(err => {
      console.error(err);
      setError('Failed to initialize player');
=======
      player.on('waiting',  () => { if (!destroyed) { setIsBuffering(true);  updateBuffer(); } });
      player.on('playing',  () => {
        if (!destroyed) setIsBuffering(false);
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      });
      player.on('canplay',  () => { if (!destroyed) setIsBuffering(false); });
      player.on('progress', () => { updateBuffer(); });

      // ── Stall recovery ──
      player.on('stalled', () => {
        console.warn('Stalled — retry in 2 s');
        stallTimer = setTimeout(() => {
          if (!destroyed) player.play().catch(() => {});
        }, 2000);
      });

      // ── Error + stream refresh ──
      player.on('error', async () => {
        const vjsError = player.error();
        console.warn('VJS error:', vjsError?.code, vjsError?.message);
        if (vjsError?.code === 2 || vjsError?.code === 4) {
          const freshUrl = await refreshStream();
          if (freshUrl && !destroyed) {
            player.error(null);
            player.src({ src: freshUrl, type: getMimeType(freshUrl) });
            player.load();
            try { await player.play(); } catch {}
          }
        }
      });

      // ── Auto quality: listen to VHS bandwidth and downgrade if needed ──
      player.on('bandwidthupdate', () => {
        if (manualQuality) return; // user has overridden — respect that
        // VHS will handle adaptive streaming internally; just update label
        setSelectedQuality('Auto');
      });
    };

    initPlayer().catch((err) => {
      console.error('Player init failed:', err);
      setError('Failed to initialize video player.');
>>>>>>> ad5d9b3 (jinnah)
    });

    return () => {
      destroyed = true;
      if (stallTimer) clearTimeout(stallTimer);
<<<<<<< HEAD
      if (playerRef.current) playerRef.current.dispose();
    };
  }, [fileData, retryCount]);

  const refreshStream = useCallback(async () => {
    if (!url) return null;
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: decodeURIComponent(url as string) }),
      });
      const data = await res.json();
      return data?.streamUrl ?? null;
    } catch {
      return null;
    }
  }, [url]);

=======
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }
    };
  }, [fileData, refreshStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 5. Quality change handler ──────────────────────────────────────────────
>>>>>>> ad5d9b3 (jinnah)
  const handleQualityChange = useCallback((label: string) => {
    setSelectedQuality(label);
    setShowQualityMenu(false);
    const player = playerRef.current;
    if (!player || !fileData) return;

<<<<<<< HEAD
    const currentTime = player.currentTime();

    if (label === 'Auto') {
      setManualQuality(false);
      player.src({ src: getProxyUrl(fileData.streamUrl), type: getMimeType(fileData.streamUrl) });
    } else {
      setManualQuality(true);
      const match = fileData.qualities?.find(q => q.label === label);
      if (match) {
        player.src({ src: getProxyUrl(match.url), type: getMimeType(match.url) });
      }
    }
    player.currentTime(currentTime);
    player.play().catch(() => {});
  }, [fileData]);

  const handleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player) return;

    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = touch.clientX - rect.left < rect.width / 2;
    const side = isLeft ? 'left' : 'right';

    tapCountRef.current += 1;
    tapSideRef.current = side;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current >= 2) {
        const delta = tapSideRef.current === 'right' ? SEEK_SECONDS : -SEEK_SECONDS;
        const newTime = Math.max(0, Math.min(player.currentTime() + delta, player.duration() || 0));
        player.currentTime(newTime);
      } else {
        player.paused() ? player.play().catch(() => {}) : player.pause();
      }
      tapCountRef.current = 0;
      tapSideRef.current = null;
    }, DOUBLE_TAP_DELAY);
  }, []);
=======
    if (label === 'Auto') {
      setManualQuality(false);
      // Restore original source so VHS picks quality adaptively
      player.src({ src: fileData.streamUrl, type: getMimeType(fileData.streamUrl) });
      player.play().catch(() => {});
      return;
    }

    setManualQuality(true);

    // Try to find a matching quality URL from fileData.qualities
    const match = fileData.qualities?.find((q) => q.label === label);
    if (match) {
      const currentTime = player.currentTime();
      player.src({ src: match.url, type: getMimeType(match.url) });
      player.currentTime(currentTime);
      player.play().catch(() => {});
      return;
    }

    // Fallback: use VHS rendition selection by height if available
    const vhs = player.tech(true)?.vhs;
    if (vhs && vhs.representations) {
      const heightMap: Record<string, number> = { '360p': 360, '480p': 480, '720p': 720 };
      const targetHeight = heightMap[label];
      vhs.representations().forEach((r: any) => {
        r.enabled(r.height === targetHeight);
      });
    }
  }, [fileData]);

  // ─── 6. Double-tap seek (touch) ─────────────────────────────────────────────
  const handleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player) return;
>>>>>>> ad5d9b3 (jinnah)

    const touch  = e.changedTouches[0];
    const rect   = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isLeft = touch.clientX - rect.left < rect.width / 2;
    const side   = isLeft ? 'left' : 'right';

    tapCountRef.current += 1;
    tapSideRef.current   = side;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    tapTimerRef.current = setTimeout(() => {
      const count = tapCountRef.current;
      const s     = tapSideRef.current;
      tapCountRef.current = 0;
      tapSideRef.current  = null;

      if (count >= 2) {
        const delta  = s === 'right' ? SEEK_SECONDS : -SEEK_SECONDS;
        const newTime = Math.max(0, Math.min(player.currentTime() + delta, player.duration() || 0));
        player.currentTime(newTime);
      } else {
        // Single tap — toggle play/pause
        if (player.paused()) player.play().catch(() => {});
        else player.pause();
      }
    }, DOUBLE_TAP_DELAY);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
<<<<<<< HEAD
        <title>{fileData ? `${fileData.title} — TeraStream` : 'TeraStream'}</title>
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
=======
        <title>{fileData ? `${fileData.title} — TeraStream` : 'Loading… — TeraStream'}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Video.js CSS only — JS is imported dynamically, NOT via CDN script */}
>>>>>>> ad5d9b3 (jinnah)
        <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
      </Head>

      <Navbar />
      <main className="player-page">
        <div className="player-inner">
<<<<<<< HEAD
          {loading && <div className="ts-loading"><div className="ts-spinner" /><p>Resolving video...</p></div>}
          {error && <div className="ts-error"><h3>Playback Error</h3><p>{error}</p><button onClick={() => router.push('/')}>Try Another Link</button></div>}

          {fileData && !loading && !error && (
            <>
              <div ref={wrapperRef} className="ts-player-shell" onTouchEnd={handleTap}>
                <div ref={containerRef} className="ts-player-container" />

=======
          {/* Ad slot — top */}
          <div className="ad-slot ad-slot-banner">Advertisement</div>

          {/* ── Loading ── */}
          {loading && (
            <div className="ts-loading">
              <div className="ts-spinner" />
              <p>Resolving your link, please wait…</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="ts-error">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="#FF5B5B" strokeWidth="2" />
                <path d="M24 14V26M24 32V34" stroke="#FF5B5B" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <h3>Unable to Load Video</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={() => router.push('/')}>← Try Another Link</button>
            </div>
          )}

          {/* ── Player ── */}
          {fileData && !loading && !error && (
            <>
              {/* Touch wrapper — handles double-tap seek */}
              <div
                ref={wrapperRef}
                className="ts-player-shell"
                onTouchEnd={handleTap}
              >
                {/* Video.js container */}
                <div className="ts-player-container" ref={containerRef} />

                {/* ── Buffer overlay ── */}
>>>>>>> ad5d9b3 (jinnah)
                {isBuffering && (
                  <div className="ts-buffer-overlay">
                    <div className="ts-buffer-box">
                      <div className="ts-buffer-ring" />
                      <div className="ts-buffer-track">
<<<<<<< HEAD
                        <div className="ts-buffer-fill" style={{ width: `${bufferPct}%` }} />
=======
                        <div
                          className="ts-buffer-fill"
                          style={{ width: `${bufferPct}%` }}
                        />
>>>>>>> ad5d9b3 (jinnah)
                      </div>
                      <span className="ts-buffer-pct">{bufferPct}%</span>
                    </div>
                  </div>
                )}

<<<<<<< HEAD
                <div className="ts-quality-wrap" ref={qualityMenuRef}>
                  <button className="ts-quality-btn" onClick={() => setShowQualityMenu(!showQualityMenu)}>
                    <span>{selectedQuality}</span>
                  </button>
                  {showQualityMenu && (
                    <ul className="ts-quality-menu">
                      {['Auto', '360p', '480p', '720p'].map(label => (
                        <li key={label} className={`ts-quality-item ${selectedQuality === label ? 'active' : ''}`} onClick={() => handleQualityChange(label)}>
                          {label}
=======
                {/* ── Quality selector (top-right corner) ── */}
                <div className="ts-quality-wrap" ref={qualityMenuRef}>
                  <button
                    className="ts-quality-btn"
                    onClick={() => setShowQualityMenu((v) => !v)}
                    title="Quality"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="4" width="14" height="2.5" rx="1" fill="currentColor" />
                      <rect x="1" y="8" width="10" height="2.5" rx="1" fill="currentColor" />
                      <rect x="1" y="12" width="6" height="2.5" rx="1" fill="currentColor" />
                    </svg>
                    <span>{selectedQuality}</span>
                  </button>

                  {showQualityMenu && (
                    <ul className="ts-quality-menu">
                      {QUALITY_LABELS.map((label) => (
                        <li
                          key={label}
                          className={`ts-quality-item${selectedQuality === label ? ' active' : ''}`}
                          onClick={() => handleQualityChange(label)}
                        >
                          {label === 'Auto' && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 6 }}>
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
                              <path d="M4 6l1.5 1.5L8.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {label}
                          {selectedQuality === label && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto' }}>
                              <path d="M2 5l2.5 2.5L8.5 2.5" stroke="#6C47FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
>>>>>>> ad5d9b3 (jinnah)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

<<<<<<< HEAD
              <div className="ts-info">
                <h1 className="ts-title">{fileData.title}</h1>
                <div className="ts-meta">
                  {fileData.size && <span className="ts-meta-chip">{fileData.size}</span>}
                  {fileData.resolution && <span className="ts-meta-chip">{fileData.resolution}</span>}
                  {fileData.duration && <span className="ts-meta-chip">{fileData.duration}</span>}
=======
              {/* ── File metadata ── */}
              <div className="ts-info">
                <h1 className="ts-title">{fileData.title}</h1>
                <div className="ts-meta">
                  {fileData.size && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 6.5H9M6.5 4V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {fileData.size}
                    </span>
                  )}
                  {fileData.resolution && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4.5 8L6.5 6L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {fileData.resolution}
                    </span>
                  )}
                  {fileData.duration && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {fileData.duration}
                    </span>
                  )}
                </div>
              </div>

              {/* Ad slot — below metadata */}
              <div className="ad-slot ad-slot-banner">Advertisement</div>

              {/* ── Download bar ── */}
              <div className="ts-download-bar">
                <div className="ts-download-info">
                  <strong>Download File</strong>
                  <span>{fileData.title}</span>
>>>>>>> ad5d9b3 (jinnah)
                </div>
              </div>

              <div className="ts-download-bar">
                <a href={`/api/download?id=${encodeURIComponent(fileData.downloadUrl)}`} className="btn-primary" download>Download</a>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

<<<<<<< HEAD
      {/* Video.js Global Styles */}
      <style jsx global>{`
        .video-js .vjs-big-play-button { background: rgba(108,71,255,0.9) !important; }
        .video-js .vjs-play-progress { background: #6C47FF !important; }
=======
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        /* ── Video.js overrides ─────────────────────────────── */
        .video-js { width: 100% !important; height: 100% !important; }

        .video-js .vjs-big-play-button {
          background: rgba(108,71,255,0.88) !important;
          border: none !important;
          border-radius: 50% !important;
          width: 68px !important; height: 68px !important;
          line-height: 68px !important;
          top: 50% !important; left: 50% !important;
          transform: translate(-50%,-50%) !important;
          margin: 0 !important;
          transition: background 0.2s, transform 0.15s !important;
        }
        .video-js .vjs-big-play-button:hover {
          background: rgba(108,71,255,1) !important;
          transform: translate(-50%,-50%) scale(1.08) !important;
        }

        .video-js .vjs-control-bar {
          background: linear-gradient(transparent, rgba(0,0,0,0.85)) !important;
          height: 52px !important;
          padding: 0 8px !important;
          align-items: center !important;
        }
        .video-js .vjs-play-progress  { background: #6C47FF !important; }
        .video-js .vjs-load-progress  { background: rgba(108,71,255,0.25) !important; }
        .video-js .vjs-slider-bar     { background: rgba(255,255,255,0.15) !important; }
        .video-js .vjs-volume-level   { background: #6C47FF !important; }

        /* Hide default VJS quality picker — we use our own */
        .video-js .vjs-quality-selector { display: none !important; }
      `}</style>

      <style jsx>{`
        /* ── Player shell ───────────────────────────────────── */
        .ts-player-shell {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
        }

        .ts-player-container {
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        /* ── Buffer overlay ─────────────────────────────────── */
        .ts-buffer-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 30;
          background: rgba(0,0,0,0.18);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        .ts-buffer-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: rgba(12,12,18,0.82);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px 28px;
          min-width: 140px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        /* Spinning ring */
        .ts-buffer-ring {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6C47FF;
          border-radius: 50%;
          animation: tsSpinRing 0.8s linear infinite;
        }
        @keyframes tsSpinRing {
          to { transform: rotate(360deg); }
        }

        /* Progress bar */
        .ts-buffer-track {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          overflow: hidden;
        }
        .ts-buffer-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #6C47FF, #9B77FF);
          transition: width 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        /* Shimmer effect on buffer bar */
        .ts-buffer-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          animation: tsShimmer 1.4s infinite;
        }
        @keyframes tsShimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }

        /* Percentage text */
        .ts-buffer-pct {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          letter-spacing: 0.5px;
          min-width: 36px;
          text-align: center;
        }

        /* ── Quality selector ───────────────────────────────── */
        .ts-quality-wrap {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 40;
        }

        .ts-quality-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px 5px 8px;
          background: rgba(12,12,18,0.72);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background 0.18s, border-color 0.18s;
        }
        .ts-quality-btn:hover {
          background: rgba(108,71,255,0.5);
          border-color: rgba(108,71,255,0.6);
        }

        .ts-quality-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: rgba(14,14,22,0.96);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          list-style: none;
          margin: 0; padding: 4px 0;
          min-width: 120px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          animation: tsMenuIn 0.14s ease;
        }
        @keyframes tsMenuIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        .ts-quality-item {
          display: flex;
          align-items: center;
          padding: 9px 14px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .ts-quality-item:hover {
          background: rgba(108,71,255,0.18);
          color: #fff;
        }
        .ts-quality-item.active {
          color: #fff;
          font-weight: 600;
        }

        /* ── File info ──────────────────────────────────────── */
        .ts-info {
          padding: 16px 0 8px;
        }
        .ts-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(15px, 2.5vw, 19px);
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0 0 10px;
          line-height: 1.35;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .ts-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ts-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: rgba(108,71,255,0.12);
          border: 1px solid rgba(108,71,255,0.22);
          border-radius: 99px;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: var(--text-secondary, rgba(255,255,255,0.65));
        }

        /* ── Download bar ───────────────────────────────────── */
        .ts-download-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(108,71,255,0.08);
          border: 1px solid rgba(108,71,255,0.18);
          border-radius: 12px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .ts-download-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .ts-download-info strong {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: var(--text-primary, #fff);
        }
        .ts-download-info span {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: var(--text-secondary, rgba(255,255,255,0.55));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        /* ── Loading / Error ────────────────────────────────── */
        .ts-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 20px;
          color: var(--text-secondary, rgba(255,255,255,0.55));
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
        }
        .ts-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(108,71,255,0.2);
          border-top-color: #6C47FF;
          border-radius: 50%;
          animation: tsSpinRing 0.8s linear infinite;
        }
        .ts-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 20px;
          text-align: center;
          font-family: 'Poppins', sans-serif;
        }
        .ts-error h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0;
        }
        .ts-error p {
          font-size: 14px;
          color: var(--text-secondary, rgba(255,255,255,0.55));
          margin: 0 0 12px;
        }

        /* ── Mobile tweaks ──────────────────────────────────── */
        @media (max-width: 480px) {
          .ts-quality-btn span { display: none; }
          .ts-quality-btn { padding: 6px; }
          .ts-download-bar { flex-direction: column; align-items: flex-start; }
          .ts-download-info span { max-width: 100%; }
        }
>>>>>>> ad5d9b3 (jinnah)
      `}</style>

      {/* Your existing <style jsx> remains the same */}
    </>
  );
}