import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Quality { label: string; url: string; }
interface Subtitle { label: string; lang: string; url: string; }
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
}

export default function WatchPage() {
  const router = useRouter();
  const { url } = router.query;

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
        if (!data?.streamUrl) throw new Error('No stream URL');
        setFileData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  // Outside click for quality menu
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Initialize Player
  useEffect(() => {
    if (!fileData || !containerRef.current) return;

    let destroyed = false;
    let stallTimer: NodeJS.Timeout | null = null;

    const initPlayer = async () => {
      const { default: videojs } = await import('video.js');
      if (destroyed) return;

      if (playerRef.current) playerRef.current.dispose();

      containerRef.current!.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.className = 'video-js vjs-big-play-centered';
      videoEl.setAttribute('controls', '');
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

      playerRef.current = videojs(videoEl, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            overrideNative: false,           // ← Most important for stability
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
          },
        },
        sources,
      });

      const player = playerRef.current;

      const updateBuffer = () => {
        const vid = player.el()?.querySelector('video') as HTMLVideoElement;
        if (!vid?.buffered?.length || !vid.duration) return;
        const pct = Math.round((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
        setBufferPct(Math.min(pct, 100));
      };

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
    });

    return () => {
      destroyed = true;
      if (stallTimer) clearTimeout(stallTimer);
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

  const handleQualityChange = useCallback((label: string) => {
    setSelectedQuality(label);
    setShowQualityMenu(false);
    const player = playerRef.current;
    if (!player || !fileData) return;

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

  return (
    <>
      <Head>
        <title>{fileData ? `${fileData.title} — TeraStream` : 'TeraStream'}</title>
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
      </Head>

      <Navbar />
      <main className="player-page">
        <div className="player-inner">
          {loading && <div className="ts-loading"><div className="ts-spinner" /><p>Resolving video...</p></div>}
          {error && <div className="ts-error"><h3>Playback Error</h3><p>{error}</p><button onClick={() => router.push('/')}>Try Another Link</button></div>}

          {fileData && !loading && !error && (
            <>
              <div ref={wrapperRef} className="ts-player-shell" onTouchEnd={handleTap}>
                <div ref={containerRef} className="ts-player-container" />

                {isBuffering && (
                  <div className="ts-buffer-overlay">
                    <div className="ts-buffer-box">
                      <div className="ts-buffer-ring" />
                      <div className="ts-buffer-track">
                        <div className="ts-buffer-fill" style={{ width: `${bufferPct}%` }} />
                      </div>
                      <span className="ts-buffer-pct">{bufferPct}%</span>
                    </div>
                  </div>
                )}

                <div className="ts-quality-wrap" ref={qualityMenuRef}>
                  <button className="ts-quality-btn" onClick={() => setShowQualityMenu(!showQualityMenu)}>
                    <span>{selectedQuality}</span>
                  </button>
                  {showQualityMenu && (
                    <ul className="ts-quality-menu">
                      {['Auto', '360p', '480p', '720p'].map(label => (
                        <li key={label} className={`ts-quality-item ${selectedQuality === label ? 'active' : ''}`} onClick={() => handleQualityChange(label)}>
                          {label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="ts-info">
                <h1 className="ts-title">{fileData.title}</h1>
                <div className="ts-meta">
                  {fileData.size && <span className="ts-meta-chip">{fileData.size}</span>}
                  {fileData.resolution && <span className="ts-meta-chip">{fileData.resolution}</span>}
                  {fileData.duration && <span className="ts-meta-chip">{fileData.duration}</span>}
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

      {/* Video.js Global Styles */}
      <style jsx global>{`
        .video-js .vjs-big-play-button { background: rgba(108,71,255,0.9) !important; }
        .video-js .vjs-play-progress { background: #6C47FF !important; }
      `}</style>

      {/* Your existing <style jsx> remains the same */}
    </>
  );
}