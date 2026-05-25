import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

// Helper: detect MIME type from URL
function getMimeType(url: string): string {
  if (url.includes('.m3u8')) return 'application/x-mpegURL';
  if (url.includes('.mpd')) return 'application/dash+xml';
  if (url.includes('.webm')) return 'video/webm';
  return 'video/mp4';
}

export default function WatchPage() {
  const router = useRouter();
  const { url } = router.query;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // ─── 2. Refresh stream URL on error ─────────────────────────────────────────
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

  // ─── 3. Initialize Video.js (only after fileData is ready) ──────────────────
  useEffect(() => {
    if (!fileData || !containerRef.current) return;

    let destroyed = false;

    const initPlayer = async () => {
      // ── IMPORTANT: Only import Video.js dynamically — never load from CDN
      //    AND from import() at the same time. Remove the CDN <script> tag.
      const { default: videojs } = await import('video.js');

      if (destroyed) return;

      // Clean up any previous player
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }

      // Clear container and inject a fresh <video> element
      containerRef.current!.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.className = 'video-js vjs-big-play-centered';
      videoEl.setAttribute('controls', '');
      videoEl.setAttribute('preload', 'auto');
      videoEl.setAttribute('playsinline', ''); // iOS inline playback
      if (fileData.thumbnail) videoEl.setAttribute('poster', fileData.thumbnail);
      containerRef.current!.appendChild(videoEl);
      videoRef.current = videoEl;

      // Build sources list
      const sources = fileData.qualities?.length
        ? fileData.qualities.map((q) => ({ src: q.url, type: getMimeType(q.url), label: q.label }))
        : [{ src: fileData.streamUrl, type: getMimeType(fileData.streamUrl) }];

      // Build tracks list
      const tracks = Array.isArray(fileData.subtitles)
        ? fileData.subtitles
            .filter((s) => s?.url && s?.lang)
            .map((s) => ({ kind: 'subtitles' as const, src: s.url, srclang: s.lang, label: s.label }))
        : [];

      playerRef.current = videojs(videoEl, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            // Allow cross-origin HLS without withCredentials
            xhr: { beforeRequest: (opt: any) => opt },
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        sources,
        tracks,
      });

      const player = playerRef.current;

      // ── Error handler: try to refresh the stream URL before giving up
      player.on('error', async () => {
        const vjsError = player.error();
        console.warn('Video.js error:', vjsError?.code, vjsError?.message);

        // Code 2 = network error, Code 4 = format not supported
        if (vjsError?.code === 2 || vjsError?.code === 4) {
          console.log('Attempting stream refresh…');
          const freshUrl = await refreshStream();
          if (freshUrl && !destroyed) {
            player.error(null); // clear error state
            player.src({ src: freshUrl, type: getMimeType(freshUrl) });
            player.load();
            try { await player.play(); } catch {}
          }
        }
      });

      // ── Stall recovery
      let stallTimer: ReturnType<typeof setTimeout> | null = null;
      player.on('stalled', () => {
        console.warn('Playback stalled — retrying in 2 s');
        stallTimer = setTimeout(() => {
          if (!destroyed) player.play().catch(() => {});
        }, 2000);
      });

      player.on('playing', () => {
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      });

      player.on('waiting', () => console.log('Buffering…'));
    };

    initPlayer().catch((err) => {
      console.error('Player init failed:', err);
      setError('Failed to initialize video player.');
    });

    // ── Cleanup
    return () => {
      destroyed = true;
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch {}
        playerRef.current = null;
      }
    };
  }, [fileData, refreshStream]);

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
        {/* ✅ Video.js CSS only — do NOT add the video.min.js CDN script tag here.
            Video.js is imported dynamically via import() in the useEffect above.
            Having both the CDN <script> AND the dynamic import causes double-
            registration of the videojs global which breaks player initialization. */}
        <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
      </Head>

      <Navbar />

      <main className="player-page">
        <div className="player-inner">
          {/* Ad slot above player */}
          <div className="ad-slot ad-slot-banner">Advertisement</div>

          {/* Loading */}
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Resolving your link, please wait…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-state">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="#FF5B5B" strokeWidth="2" />
                  <path d="M24 14V26M24 32V34" stroke="#FF5B5B" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>
                Unable to Load Video
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
              <button className="btn-primary" onClick={() => router.push('/')}>
                ← Try Another Link
              </button>
            </div>
          )}

          {/* Player + info */}
          {fileData && !loading && !error && (
            <>
              {/* Video container — Video.js mounts here */}
              <div className="player-wrapper" ref={containerRef} />

              {/* File metadata */}
              <div className="player-info">
                <h1 className="file-title">{fileData.title}</h1>
                <div className="file-meta">
                  {fileData.size && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="2" y="2" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5 7.5H10M7.5 5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      {fileData.size}
                    </div>
                  )}
                  {fileData.resolution && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5.5 9.5L7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      {fileData.resolution}
                    </div>
                  )}
                  {fileData.duration && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M7.5 4.5V7.5L9.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      {fileData.duration}
                    </div>
                  )}
                </div>
              </div>

              {/* Ad slot below metadata */}
              <div className="ad-slot ad-slot-banner">Advertisement</div>

              {/* Download bar */}
              <div className="download-bar">
                <div className="download-info">
                  <strong style={{ color: 'var(--text-primary)' }}>Download File</strong>
                  <span style={{ marginLeft: '12px' }}>{fileData.title}</span>
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

      <style jsx>{`
        .video-js {
          width: 100%;
          height: 100%;
        }
        .vjs-big-play-button {
          background: rgba(108, 71, 255, 0.9) !important;
          border-radius: 50% !important;
          width: 70px !important;
          height: 70px !important;
          line-height: 70px !important;
          border: none !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
        }
        .vjs-control-bar {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.9)) !important;
          height: 48px !important;
        }
        .vjs-play-progress {
          background: #6c47ff !important;
        }
        .vjs-load-progress {
          background: rgba(108, 71, 255, 0.3) !important;
        }
      `}</style>
    </>
  );
}