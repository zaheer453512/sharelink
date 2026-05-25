import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface FileData {
  title: string;
  size: string;
  resolution: string;
  duration: string;
  thumbnail: string;

  streamUrl: string;

  qualities?: {
    label: string;
    url: string;
  }[];

  downloadUrl: string;

  subtitles?: {
    label: string;
    lang: string;
    url: string;
  }[];
}

export default function WatchPage() {
  const router = useRouter();
  const { url } = router.query;
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch video data from backend
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
        if (!res.ok) throw new Error('Failed to resolve link');
        const data = await res.json();
        setFileData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load video. Please check your link.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  // Initialize Video.js player
  useEffect(() => {
    if (!fileData || !playerRef.current) return;

    const initPlayer = async () => {
      const videojs = (await import('video.js')).default;
      if (playerInstance.current) {
        playerInstance.current.dispose();
      }

      // Create video element
      const videoEl = document.createElement('video');
      videoEl.className = 'video-js vjs-big-play-centered vjs-theme-custom';
      videoEl.setAttribute('controls', '');
      videoEl.setAttribute('preload', 'auto');
      if (fileData.thumbnail) videoEl.setAttribute('poster', fileData.thumbnail);
      playerRef.current!.innerHTML = '';
      playerRef.current!.appendChild(videoEl);

      playerInstance.current = videojs(videoEl, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        html5: {
  vhs: {
    overrideNative: true,
    enableLowInitialPlaylist: true,
    smoothQualityChange: true,
  },
},
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        sources: fileData.qualities?.length
  ? fileData.qualities.map((q) => ({
      src: q.url,
      label: q.label,
      type: q.url.includes('.m3u8')
        ? 'application/x-mpegURL'
        : 'video/mp4',
    }))
  : [
      {
        src: fileData.streamUrl,
        type: fileData.streamUrl.includes('.m3u8')
          ? 'application/x-mpegURL'
          : 'video/mp4',
      },
    ],
        tracks: Array.isArray(fileData.subtitles)
  ? fileData.subtitles
      .filter((s) => s?.url)
      .map((s) => ({
        kind: 'subtitles',
        src: s.url,
        srclang: s.lang,
        label: s.label,
      }))
  : [],
      });
      playerInstance.current.on('error', async () => {
  console.warn('Stream error detected');

  try {
    const response = await fetch('/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: decodeURIComponent(url as string),
      }),
    });

    const refreshed = await response.json();

    if (refreshed?.streamUrl) {
      playerInstance.current.src({
        src: refreshed.streamUrl,
        type: refreshed.streamUrl.includes('.m3u8')
  ? 'application/x-mpegURL'
  : 'video/mp4',
      });

      await playerInstance.current.play();
    }
  } catch (err) {
    console.error('Failed to refresh stream:', err);
  }
});
playerInstance.current.on('stalled', () => {
  console.warn('Playback stalled');

  setTimeout(() => {
    playerInstance.current.play();
  }, 1000);
});

playerInstance.current.on('waiting', () => {
  console.log('Buffering...');
});
    };

    initPlayer();

    return () => {
      if (playerInstance.current) {
        playerInstance.current.dispose();
        playerInstance.current = null;
      }
    };
  }, [fileData]);

  const formatBytes = (bytes: string) => bytes;

  return (
    <>
      <Head>
        <title>{fileData ? `${fileData.title} — TeraStream` : 'Loading... — TeraStream'}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
        <script src="https://vjs.zencdn.net/8.6.1/video.min.js" defer />
      </Head>

      <Navbar />

      <main className="player-page">
        <div className="player-inner">

          {/* Ad slot above player */}
          <div className="ad-slot ad-slot-banner">Advertisement</div>

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Resolving your link, please wait...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="#FF5B5B" strokeWidth="2"/>
                  <path d="M24 14V26M24 32V34" stroke="#FF5B5B" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>Unable to Load Video</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
              <button className="btn-primary" onClick={() => router.push('/')}>
                ← Try Another Link
              </button>
            </div>
          )}

          {fileData && !loading && (
            <>
              {/* Player */}
              <div className="player-wrapper" ref={playerRef} />

              {/* File info */}
              <div className="player-info">
                <h1 className="file-title">{fileData.title}</h1>
                <div className="file-meta">
                  {fileData.size && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="2" y="2" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M5 7.5H10M7.5 5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      {fileData.size}
                    </div>
                  )}
                  {fileData.resolution && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M5.5 9.5L7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      {fileData.resolution}
                    </div>
                  )}
                  {fileData.duration && (
                    <div className="meta-item">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M7.5 4.5V7.5L9.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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
                    <path d="M8 2V11M8 11L5 8M8 11L11 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 14H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
        .vjs-theme-custom .vjs-big-play-button {
          background: rgba(108,71,255,0.9) !important;
          border-radius: 50% !important;
          width: 70px !important;
          height: 70px !important;
          line-height: 70px !important;
          border: none !important;
        }
        .vjs-theme-custom .vjs-control-bar {
          background: linear-gradient(transparent, rgba(0,0,0,0.9)) !important;
          height: 48px !important;
        }
        .vjs-theme-custom .vjs-play-progress {
          background: #6C47FF !important;
        }
      `}</style>
    </>
  );
}