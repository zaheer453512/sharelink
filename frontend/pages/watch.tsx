import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEEK_SECONDS = 10;
const DOUBLE_TAP_DELAY = 280;
const QUALITY_LABELS = ['Auto', '360p', '480p', '720p'];

// Max retries before showing persistent error
const MAX_STALL_RETRIES = 3;
// How long (ms) to wait before stall recovery attempt
const STALL_RECOVERY_DELAY = 3000;
// Timeout (ms) for preflight HEAD request to detect stream type
const PROBE_TIMEOUT_MS = 6000;

// ─── Stream type detection ────────────────────────────────────────────────────

type StreamType = 'hls' | 'dash' | 'mp4' | 'webm' | 'unknown';

/**
 * Detect stream type by probing the URL with a HEAD request.
 * Falls back to URL-sniffing if the probe fails or times out.
 */
async function detectStreamType(url: string): Promise<StreamType> {
  // Fast path: URL contains a clear hint
  if (url.includes('.m3u8') || url.includes('m3u8')) return 'hls';
  if (url.includes('.mpd')  || url.includes('mpd'))  return 'dash';
  if (url.includes('.webm'))                          return 'webm';

  // Probe the server for Content-Type
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      // Avoid preflight issues on some CDNs
      headers: { Range: 'bytes=0-0' },
    });
    clearTimeout(timer);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('mpegurl') || ct.includes('x-mpegurl')) return 'hls';
    if (ct.includes('dash+xml'))                            return 'dash';
    if (ct.includes('webm'))                                return 'webm';
    if (ct.includes('mp4') || ct.includes('video'))        return 'mp4';

    // TeraBox-specific: if content-disposition has .mp4 → mp4
    const cd = (res.headers.get('content-disposition') || '').toLowerCase();
    if (cd.includes('.mp4')) return 'mp4';
  } catch {
    // Probe failed — fall through to URL sniff
  }

  // URL sniff fallback
  if (url.includes('.mp4')) return 'mp4';
  return 'mp4'; // TeraBox default: most direct links are MP4
}

function mimeForType(type: StreamType): string {
  switch (type) {
    case 'hls':  return 'application/x-mpegURL';
    case 'dash': return 'application/dash+xml';
    case 'webm': return 'video/webm';
    default:     return 'video/mp4';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WatchPage() {
  const router = useRouter();
  const { url } = router.query;

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<any>(null);

  // Page state
  const [fileData,  setFileData]  = useState<FileData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Buffer overlay state
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferPct,   setBufferPct]   = useState(0);

  // Quality selector state
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [manualQuality,   setManualQuality]   = useState(false);

  // Stream type state (used by quality handler)
  const streamTypeRef = useRef<StreamType>('mp4');

  // Internal double-tap refs
  const tapTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef    = useRef(0);
  const tapSideRef     = useRef<'left' | 'right' | null>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  // Stall retry counter
  const stallRetryRef = useRef(0);

  // ─── 1. Fetch video metadata ────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: decodeURIComponent(url as string) }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: FileData = await res.json();
        if (!data?.streamUrl) throw new Error('No stream URL returned from server.');
        setFileData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load video. Please check your link.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

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
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ─── 4. Initialize Video.js ─────────────────────────────────────────────────
  useEffect(() => {
    if (!fileData || !containerRef.current) return;

    let destroyed   = false;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    stallRetryRef.current = 0;

    const initPlayer = async () => {
      // ── Detect stream type before loading Video.js ──
      let detectedType: StreamType = 'mp4';
      try {
        detectedType = await detectStreamType(fileData.streamUrl);
      } catch {
        detectedType = 'mp4';
      }
      streamTypeRef.current = detectedType;

      const { default: videojs } = await import('video.js');
      if (destroyed) return;

      // Dispose previous player
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }

      // Mount fresh <video> element
      containerRef.current!.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.className = 'video-js vjs-big-play-centered';
      videoEl.setAttribute('controls', '');
      videoEl.setAttribute('preload', 'auto');
      videoEl.setAttribute('playsinline', '');
      if (fileData.thumbnail) videoEl.setAttribute('poster', fileData.thumbnail);
      containerRef.current!.appendChild(videoEl);

      // ── Build sources ──
      const isAdaptive = detectedType === 'hls' || detectedType === 'dash';

      const sources = fileData.qualities?.length
        ? fileData.qualities.map((q) => ({
            src:   q.url,
            type:  mimeForType(detectedType),
            label: q.label,
          }))
        : [{ src: fileData.streamUrl, type: mimeForType(detectedType) }];

      const tracks = Array.isArray(fileData.subtitles)
        ? fileData.subtitles
            .filter((s) => s?.url && s?.lang)
            .map((s) => ({
              kind: 'subtitles' as const,
              src: s.url,
              srclang: s.lang,
              label: s.label,
            }))
        : [];

      // ── VHS options differ for adaptive vs progressive ──
      const vhsOptions = isAdaptive
        ? {
            // HLS/DASH: adaptive bitrate, start low
            overrideNative:                  true,
            enableLowInitialPlaylist:        true,
            smoothQualityChange:             true,
            bandwidth:                       1500000, // 1.5 Mbps initial estimate
            limitRenditionByPlayerDimensions: false,   // let ABR decide freely
            useNetworkInformationApi:        true,
          }
        : {
            // Progressive MP4: disable VHS ABR overhead entirely
            overrideNative: false,
          };

      playerRef.current = videojs(videoEl, {
        autoplay:      false,
        controls:      true,
        responsive:    true,
        fluid:         true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: vhsOptions,
          nativeVideoTracks: !isAdaptive,  // native tracks fine for MP4
          nativeAudioTracks: !isAdaptive,
          nativeTextTracks:  false,
        },
        sources,
        tracks,
      });

      const player = playerRef.current;

      // ── Buffer tracking ──
      const updateBuffer = () => {
        if (destroyed) return;
        const vid = player.el()?.querySelector('video') as HTMLVideoElement | null;
        if (!vid || !vid.buffered.length || !vid.duration) return;
        const pct = Math.round(
          (vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100
        );
        setBufferPct(Math.min(pct, 100));
      };

      player.on('waiting',  () => { if (!destroyed) { setIsBuffering(true); updateBuffer(); } });
      player.on('playing',  () => {
        if (!destroyed) { setIsBuffering(false); stallRetryRef.current = 0; }
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      });
      player.on('canplay',  () => { if (!destroyed) setIsBuffering(false); });
      player.on('progress', () => { updateBuffer(); });

      // ── Stall recovery with exponential back-off + stream refresh ──
      const attemptStallRecovery = async () => {
        if (destroyed) return;

        const attempt = ++stallRetryRef.current;
        console.warn(`[TeraStream] Stall recovery attempt #${attempt}`);

        if (attempt > MAX_STALL_RETRIES) {
          // All retries exhausted — try a full stream URL refresh
          console.warn('[TeraStream] Max retries hit, refreshing stream URL…');
          const freshUrl = await refreshStream();
          if (freshUrl && !destroyed) {
            const savedTime = player.currentTime();
            player.error(null);
            player.src({ src: freshUrl, type: mimeForType(streamTypeRef.current) });
            player.load();
            player.one('canplay', () => {
              try { player.currentTime(savedTime); player.play(); } catch {}
            });
          }
          return;
        }

        // Attempt a seek-then-play to unstick the buffer
        const delay = STALL_RECOVERY_DELAY * attempt;
        stallTimer = setTimeout(() => {
          if (destroyed) return;
          const vid = player.el()?.querySelector('video') as HTMLVideoElement | null;
          if (vid) {
            // Micro-seek trick: forces browser decoder to re-request data
            const t = player.currentTime();
            player.currentTime(Math.max(0, t - 0.1));
          }
          player.play().catch(() => {});
        }, delay);
      };

      player.on('stalled', () => attemptStallRecovery());

      // ── Comprehensive error + stream refresh ──
      player.on('error', async () => {
        const vjsError = player.error();
        const code = vjsError?.code ?? -1;
        console.warn('[TeraStream] VJS error code:', code, vjsError?.message);

        // Codes 1-4 are MediaError codes; all warrant a refresh attempt
        if (code >= 1 && code <= 4) {
          const savedTime = player.currentTime();
          const freshUrl  = await refreshStream();

          if (freshUrl && !destroyed) {
            // Re-detect stream type in case URL changed
            const newType = await detectStreamType(freshUrl).catch(() => streamTypeRef.current);
            streamTypeRef.current = newType;

            player.error(null);
            player.src({ src: freshUrl, type: mimeForType(newType) });
            player.load();
            player.one('canplay', () => {
              try { player.currentTime(savedTime); player.play(); } catch {}
            });
          } else if (!destroyed) {
            setError('Stream unavailable. The link may have expired — try refreshing the page.');
          }
        }
      });

      // ── Adaptive bandwidth label update ──
      player.on('bandwidthupdate', () => {
        if (manualQuality) return;
        setSelectedQuality('Auto');
      });
    };

    initPlayer().catch((err) => {
      console.error('[TeraStream] Player init failed:', err);
      setError('Failed to initialize video player.');
    });

    return () => {
      destroyed = true;
      if (stallTimer) clearTimeout(stallTimer);
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }
    };
  }, [fileData, refreshStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 5. Quality change handler ──────────────────────────────────────────────
  const handleQualityChange = useCallback((label: string) => {
    setSelectedQuality(label);
    setShowQualityMenu(false);
    const player = playerRef.current;
    if (!player || !fileData) return;

    if (label === 'Auto') {
      setManualQuality(false);
      const type = streamTypeRef.current;
      player.src({ src: fileData.streamUrl, type: mimeForType(type) });
      player.play().catch(() => {});
      return;
    }

    setManualQuality(true);

    // Try explicit quality URL first
    const match = fileData.qualities?.find((q) => q.label === label);
    if (match) {
      const currentTime = player.currentTime();
      const type = streamTypeRef.current;
      player.src({ src: match.url, type: mimeForType(type) });
      player.one('canplay', () => {
        try { player.currentTime(currentTime); player.play(); } catch {}
      });
      return;
    }

    // Fallback: VHS rendition selection for HLS
    if (streamTypeRef.current === 'hls') {
      const vhs = player.tech(true)?.vhs;
      if (vhs?.representations) {
        const heightMap: Record<string, number> = { '360p': 360, '480p': 480, '720p': 720 };
        const targetH = heightMap[label];
        vhs.representations().forEach((r: any) => {
          r.enabled(r.height === targetH);
        });
      }
    }
  }, [fileData]);

  // ─── 6. Double-tap seek (touch) ─────────────────────────────────────────────
  const handleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player) return;

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
        const delta   = s === 'right' ? SEEK_SECONDS : -SEEK_SECONDS;
        const newTime = Math.max(0, Math.min(
          player.currentTime() + delta,
          player.duration() || 0
        ));
        player.currentTime(newTime);
      } else {
        if (player.paused()) player.play().catch(() => {});
        else player.pause();
      }
    }, DOUBLE_TAP_DELAY);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{fileData ? `${fileData.title} — TeraStream` : 'Loading… — TeraStream'}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
      </Head>

      <Navbar />

      <main className="player-page">
        <div className="player-inner">
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
                <path
                  d="M24 14V26M24 32V34"
                  stroke="#FF5B5B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <h3>Unable to Load Video</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={() => router.push('/')}>
                ← Try Another Link
              </button>
            </div>
          )}

          {/* ── Player ── */}
          {fileData && !loading && !error && (
            <>
              {/* Touch wrapper — handles double-tap seek */}
              <div ref={wrapperRef} className="ts-player-shell" onTouchEnd={handleTap}>
                {/* Video.js container */}
                <div className="ts-player-container" ref={containerRef} />

                {/* ── Buffer overlay ── */}
                {isBuffering && (
                  <div className="ts-buffer-overlay">
                    <div className="ts-buffer-box">
                      <div className="ts-buffer-ring" />
                      <div className="ts-buffer-track">
                        <div
                          className="ts-buffer-fill"
                          style={{ width: `${bufferPct}%` }}
                        />
                      </div>
                      <span className="ts-buffer-pct">{bufferPct}%</span>
                    </div>
                  </div>
                )}

                {/* ── Quality selector ── */}
                <div className="ts-quality-wrap" ref={qualityMenuRef}>
                  <button
                    className="ts-quality-btn"
                    onClick={() => setShowQualityMenu((v) => !v)}
                    title="Quality"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="4"  width="14" height="2.5" rx="1" fill="currentColor" />
                      <rect x="1" y="8"  width="10" height="2.5" rx="1" fill="currentColor" />
                      <rect x="1" y="12" width="6"  height="2.5" rx="1" fill="currentColor" />
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
                            <svg
                              width="12" height="12" viewBox="0 0 12 12" fill="none"
                              style={{ marginRight: 6 }}
                            >
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
                              <path
                                d="M4 6l1.5 1.5L8.5 4"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          {label}
                          {selectedQuality === label && (
                            <svg
                              width="10" height="10" viewBox="0 0 10 10" fill="none"
                              style={{ marginLeft: 'auto' }}
                            >
                              <path
                                d="M2 5l2.5 2.5L8.5 2.5"
                                stroke="#6C47FF"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* ── File metadata ── */}
              <div className="ts-info">
                <h1 className="ts-title">{fileData.title}</h1>
                <div className="ts-meta">
                  {fileData.size && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4 6.5H9M6.5 4V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      {fileData.size}
                    </span>
                  )}
                  {fileData.resolution && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4.5 8L6.5 6L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      {fileData.resolution}
                    </span>
                  )}
                  {fileData.duration && (
                    <span className="ts-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
                </div>
                <a
                  href={`/api/download?id=${encodeURIComponent(fileData.downloadUrl)}`}
                  className="btn-primary"
                  download
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2V11M8 11L5 8M8 11L11 8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M2 14H14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Download
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      <style jsx global>{`
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

        .video-js .vjs-quality-selector { display: none !important; }
      `}</style>

      <style jsx>{`
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

        .ts-buffer-pct {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          letter-spacing: 0.5px;
          min-width: 36px;
          text-align: center;
        }

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

        @media (max-width: 480px) {
          .ts-quality-btn span { display: none; }
          .ts-quality-btn { padding: 6px; }
          .ts-download-bar { flex-direction: column; align-items: flex-start; }
          .ts-download-info span { max-width: 100%; }
        }
      `}</style>
    </>
  );
}