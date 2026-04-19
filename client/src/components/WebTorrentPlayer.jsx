import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function WebTorrentPlayer({ tmdbId }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initializing P2P engine...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let client = null;

    const startTorrent = async () => {
      try {
        // 1. Fetch IMDb ID from TMDB
        setStatus('Fetching metadata...');
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=422da8e52a5caed78cbbd377b2520149`);
        const tmdbData = await tmdbRes.json();
        
        if (!tmdbData.imdb_id) throw new Error("No IMDb ID found for this title.");
        
        // 2. Fetch Magnet from YTS
        setStatus('Searching P2P network...');
        const ytsRes = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${tmdbData.imdb_id}`);
        const ytsData = await ytsRes.json();
        
        const movie = ytsData?.data?.movies?.[0];
        if (!movie) throw new Error("No P2P sources found for this title.");
        
        // Prefer 1080p stream
        const torrent = movie.torrents.find(t => t.quality === '1080p') || movie.torrents[0];
        const hash = torrent.hash;
        const magnetURI = `magnet:?xt=urn:btih:${hash}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce`;

        // 3. Load WebTorrent Script if not present
        if (!window.WebTorrent) {
          setStatus('Loading WebTorrent client...');
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // 4. Start Streaming
        setStatus('Connecting to peers...');
        client = new window.WebTorrent();
        
        client.add(magnetURI, (torrentData) => {
          // Torrents can contain multiple files. Find the mp4 file.
          const file = torrentData.files.find(f => f.name.endsWith('.mp4'));
          
          if (!file) {
            setError("No playable video file found in this swarm.");
            return;
          }

          // Render it directly into the video element
          file.renderTo(videoRef.current, { autoplay: true });
          setLoading(false);

          // Track progress
          torrentData.on('download', () => {
             setProgress(Math.round(torrentData.progress * 100));
          });
        });
        
        client.on('error', (err) => {
           setError('P2P Error: ' + err.message);
        });

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    startTorrent();

    return () => {
      if (client) {
        client.destroy();
      }
    };
  }, [tmdbId]);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 gap-3 text-white p-4">
        <AlertCircle className="text-red-500 w-12 h-12 mb-2" />
        <h3 className="text-lg font-bold">P2P Stream Failed</h3>
        <p className="text-sm text-white/50 text-center max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-black group z-20">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 bg-black/80">
           <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
           <p className="text-sm font-semibold">{status}</p>
        </div>
      )}
      
      {!loading && progress < 100 && (
         <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           Seeding Buffer: {progress}%
         </div>
      )}

      {/* The actual player */}
      <video
        ref={videoRef}
        controls
        autoPlay
        className="w-full h-full"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
