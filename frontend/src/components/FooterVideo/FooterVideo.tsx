import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function FooterVideo() {
  const [videoUrl, setVideoUrl] = useState('');
  
  useEffect(() => {
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    try {
      const res = await api.get('/settings/video');
      if (res.data?.url) {
        let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fanclub-backend.onrender.com';
        if (baseUrl.includes('localhost') && typeof window !== 'undefined') {
          baseUrl = baseUrl.replace('localhost', window.location.hostname);
        }
        setVideoUrl(`${baseUrl}${res.data.url}`);
      }
    } catch {
      // No video setting — silent
    }
  };

  if (!videoUrl) return null;

  return (
    <section style={{ width: '100%', borderTop: '4px solid var(--bauhaus-black)', background: 'var(--bauhaus-black)', position: 'relative', overflow: 'hidden' }}>
      <div className="container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 className="heading-lg" style={{ color: 'var(--bauhaus-yellow)', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>FAN In Motion</h2>
        <div style={{ width: '100%', maxWidth: '1200px', border: '4px solid var(--bauhaus-red)', borderRadius: '0px', overflow: 'hidden', background: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <video 
            src={videoUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            controls
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', maxHeight: '70vh' }}
          />
        </div>
      </div>
    </section>
  );
}
