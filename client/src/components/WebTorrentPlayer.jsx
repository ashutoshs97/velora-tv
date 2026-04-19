import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Link } from 'lucide-react';
import { fetchMovieDetail, fetchYtsMagnet } from '../api';

export default function WebTorrentPlayer({ tmdbId }) {
  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initializing P2P engine...');
  const [progress, setProgress] = useState(0);
  const [manualMagnet, setManualMagnet] = useState('');
  const [awaitingMagnet, setAwaitingMagnet] = useState(false);

  const startStreamWithMagnet = async (magnetURI) => {
    try {
        setLoading(true);
        setError(null);
        setAwaitingMagnet(false);
        
        // Load WebTorrent Script if not present
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

        setStatus('Connecting to peers...');
        if (!clientRef.current) {
           clientRef.current = new window.WebTorrent();
        }
        
        clientRef.current.add(magnetURI, (torrentData) => {
          // Find any playable video format
          const file = torrentData.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));
          
          if (!file) {
            setError("No playable video file found in this swarm.");
            setAwaitingMagnet(true);
            return;
          }

          file.renderTo(videoRef.current, { autoplay: true });
          setLoading(false);

          torrentData.on('download', () => {
             setProgress(Math.round(torrentData.progress * 100));
          });
        });
        
        clientRef.current.on('error', (err) => {
           setError('P2P Error: ' + err.message);
           setAwaitingMagnet(true);
        });

    } catch (err) {
      setError(err.message);
      setAwaitingMagnet(true);
      setLoading(false);
    }
  };

  useEffect(() => {

    const fetchAutoMagnet = async () => {
      try {
        // 1. Fetch IMDb ID from our own backend which acts as a TMDB proxy
        setStatus('Fetching metadata...');
        const { data: movieDetail } = await fetchMovieDetail(tmdbId);
        const imdb_id = movieDetail?.imdb_id;
        
        if (!imdb_id) throw new Error("No IMDb ID found for this title.");
        
        // 2. Fetch Magnet securely bypassing ISP blocks
        setStatus('Searching P2P network...');
        
        let ytsData = null;
        try {
          const ytsRes = await fetchYtsMagnet(imdb_id);
          ytsData = ytsRes.data;
        } catch (backendError) {
          console.warn("Backend proxy failed. Utilizing ultimate frontend proxy bypass...");
          // If the backend is unreachable or throwing 500s because the local server isn't updated
          const tpbProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://apibay.org/q.php?q=${imdb_id}`)}`;
          const proxyRes = await fetch(tpbProxyUrl);
          const proxyWrapper = await proxyRes.json();
          const tpbData = JSON.parse(proxyWrapper.contents);
          
          if (Array.isArray(tpbData) && tpbData.length > 0 && tpbData[0].info_hash !== '0000000000000000000000000000000000000000') {
             const sorted = tpbData.sort((a, b) => Number(b.seeders) - Number(a.seeders));
             const best = sorted.find(t => t.name.includes('1080p')) || sorted[0];
             ytsData = {
                status: 'ok',
                data: { movies: [{ torrents: [{ hash: best.info_hash, quality: '1080p', type: 'tpb' }] }] }
             };
          } else {
             throw new Error("No torrents found across any network structure.");
          }
        }
        
        if (!ytsData || (ytsData.status !== 'ok' && !ytsData.data)) throw new Error("Auto-search blocked by ISP or Network.");

        const movie = ytsData?.data?.movies?.[0];
        if (!movie) throw new Error("Movie not found on the auto-P2P network.");
        
        // Prefer 1080p stream
        const torrent = movie.torrents.find(t => t.quality === '1080p') || movie.torrents[0];
        const hash = torrent.hash;
        const magnetURI = `magnet:?xt=urn:btih:${hash}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce`;

        // 3. Hand off to stream
        startStreamWithMagnet(magnetURI);

      } catch (err) {
        setError(err.message);
        setAwaitingMagnet(true);
        setLoading(false);
      }
    };

    fetchAutoMagnet();

    return () => {
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, [tmdbId]);

  if (awaitingMagnet) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 gap-4 p-6 text-center">
        <AlertCircle className="text-amber-500 w-12 h-12 mb-2" />
        <h3 className="text-lg font-bold text-white">Manual P2P Required</h3>
        <p className="text-sm text-white/60 max-w-sm mb-2">
          {error}
          <br/><br/>
          You can stream any movie directly by pasting a Magnet URI. Wait for peers to connect after submitting.
        </p>
        
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden w-full max-w-md focus-within:border-[var(--color-primary)] transition-colors shadow-2xl mt-2">
           <div className="px-3 flex items-center justify-center bg-white/5 border-r border-white/5">
              <Link size={16} className="text-white/50" />
           </div>
           <input 
             type="text" 
             placeholder="magnet:?xt=urn:btih:..."
             value={manualMagnet}
             onChange={e => setManualMagnet(e.target.value)}
             className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none"
           />
           <button 
             onClick={() => startStreamWithMagnet(manualMagnet)}
             disabled={!manualMagnet.startsWith('magnet:')}
             className="px-5 font-bold text-xs bg-prime-blue text-white hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
             style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}
           >
             Stream
           </button>
        </div>
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
