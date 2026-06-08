import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Film, Sparkles, Palette, Clapperboard } from 'lucide-react';
import AnimatedPage, { fandomticItem, fandomticStagger } from '../../components/AnimatedPage';
import './Fandom.css';

export default function Fandom() {
  const heroRef = useRef<HTMLElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    import('../../lib/api').then(({ default: api }) => {
      api.get('/settings/video').then(res => {
        if (res.data?.url) {
          setVideoUrl(import.meta.env.VITE_API_URL.replace('/api', '') + res.data.url);
        }
      }).catch(() => {});
    });
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.45]);

  const inspirations = [
    { title: 'The Character Within', desc: 'Where characters live in us. Our designs embody the soul of the iconic roles we grew up idolizing.', icon: Film, color: 'var(--bauhaus-yellow)' },
    { title: 'A World of Fandom', desc: 'Celebrating the legacy, action, drama, and pure emotion of being a true FAN across all universes.', icon: Sparkles, color: 'var(--bauhaus-red)' },
    { title: 'Script & Typography', desc: 'Unique typography that speaks the language of pop culture and fandom seamlessly.', icon: Palette, color: 'var(--bauhaus-blue)' },
    { title: 'Fandomtic Glory', desc: 'From the silver screen and anime panels to the streets. Wearing the culture proudly.', icon: Clapperboard, color: 'var(--bauhaus-green)' },
  ];

  const fandomPoem = [
    { text: 'Fandom is the one who cries,\nFandom is the one who smiles.', color: 'var(--bauhaus-yellow)' },
    { text: 'Fandom is the one who cheers,\nFandom is the rhythm in every heartbeat.', color: 'var(--bauhaus-red)' },
    { text: 'Fandom is the one who feels,\nFandom is the rush of pure emotion.', color: 'var(--bauhaus-blue)' },
    { text: 'Fandom is the one who fights,\nFandom is the courage of our heroes.', color: 'var(--bauhaus-green)' },
    { text: 'Fandom is the one who speaks,\nFandom is the power of an iconic dialogue.', color: 'var(--bauhaus-yellow)' },
    { text: 'Fandom is the one who walks,\nFandom is the journey of endless dreams.', color: 'var(--bauhaus-red)' },
    { text: 'Fandom is the one who stands,\nFandom is the strength of epic stories.', color: 'var(--bauhaus-blue)' },
    { text: 'Fandom is the silence between words,\nFandom is the echo that stays forever.', color: 'var(--bauhaus-green)' },
    { text: 'Fandom is light in the darkness,\nFandom is life beyond the screen.', color: 'var(--bauhaus-yellow)' },
    { text: 'Fandom is not just seen…\nFandom is lived, worn, and felt.', color: 'var(--bauhaus-red)' }
  ];

  return (
    <AnimatedPage>
      <div className="fandom-page" id="fandom-page">
        {/* Hero */}
        <section className="fandom-hero" ref={heroRef} style={{ position: 'relative', overflow: 'hidden' }}>
          <motion.div className="fandom-hero-bg" style={{ y: heroY, zIndex: 1 }} />
          
          {videoUrl && showVideo && (
            <motion.div 
              className="fandom-hero-video-wrapper"
              style={{ y: heroY, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isVideoLoaded ? 1 : 0 }}
              transition={{ duration: 1.5 }}
            >
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => setShowVideo(false)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(100%) contrast(1.2)'
                }}
              />
            </motion.div>
          )}

          <motion.div className="fandom-hero-vignette" style={{ opacity: heroOpacity, zIndex: 2, background: 'radial-gradient(circle at center, transparent 0%, var(--bg-primary) 85%)' }} />
          <div className="container fandom-hero-content" style={{ zIndex: 3, position: 'relative' }}>
            <motion.div
              style={{ y: heroContentY }}
              variants={fandomticStagger}
              initial="initial"
              animate="animate"
            >
              <span className="hero-tag" style={{ color: 'var(--bauhaus-black)', fontWeight: 700 }}><Film size={14} /> THE STORY OF A FAN</span>
              <motion.h1 variants={fandomticItem} style={{ whiteSpace: 'nowrap', fontSize: 'clamp(1.4rem, 6vw, 5rem)', fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.1, margin: '12px 0' }}>
                <span style={{ color: 'var(--bauhaus-yellow)' }}>BE</span>{' '}
                <span style={{ color: 'var(--bauhaus-red)' }}>YOUR OWN</span>{' '}
                <span style={{ color: 'var(--bauhaus-black)' }}>STYLE</span>
              </motion.h1>
              <motion.p className="fandom-hero-desc" variants={fandomticItem}>
                At FANCLUB, we are just like you—die-hard fans. We translate the art you love into premium streetwear. From the magic of Hollywood to the mass appeal of Tollywood, the grand spectacles of Bollywood, the raw emotions of Kollywood, and the breathtaking worlds of Anime. We wear our passion.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Philosophy */}
        <motion.section
          className="section"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75 }}
        >
          <div className="container">
            <div className="section-header">
              <p className="section-subtitle">Our Heartbeat</p>
              <h2 className="section-title">By Fans, For Fans</h2>
              <div className="section-divider" />
            </div>
            <div className="fandom-philosophy">
              <p>
                We don't just print shirts; we craft tributes. We know the feeling of watching a legendary intro, 
                hearing an iconic dialogue, or witnessing an anime transformation that gives you goosebumps. 
                That shared adrenaline is the very foundation of FANCLUB.
              </p>
              <p>
                Our mission is simple: we never disappoint a true fan. We meticulously design apparel inspired 
                by movies, anime, and pop culture, ensuring every piece carries the emotion, legacy, and 
                aesthetic of the stories that define our lives.
              </p>
            </div>
          </div>
        </motion.section>

        {/* The Legacy of FAN */}
        <motion.section
          className="section"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75 }}
          style={{ background: 'var(--bauhaus-black)', color: 'var(--bauhaus-white)' }}
        >
          <div className="container">
            <div className="section-header" style={{ borderColor: 'var(--bauhaus-white)' }}>
              <p className="section-subtitle" style={{ color: 'var(--bauhaus-yellow)' }}>A Global Canvas</p>
              <h2 className="section-title" style={{ color: 'var(--bauhaus-white)' }}>Everything We Love</h2>
              <div className="section-divider" style={{ background: 'var(--bauhaus-white)' }} />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '30px',
              marginTop: '40px'
            }}>
              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-red)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="fan-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-red)', marginBottom: '16px', fontSize: '1.4rem' }}>Hollywood & Global</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  From timeless classics to modern blockbusters, we capture the fandomtic brilliance and storytelling that have captivated the entire world. Wearing these designs means carrying a piece of fandomtic history with you.
                </p>
              </div>

              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-yellow)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="fan-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-yellow)', marginBottom: '16px', fontSize: '1.4rem' }}>Indian Fandom</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  The unmatched 'Mass' euphoria of Tollywood, the spectacular grandeur of Bollywood, and the raw, gripping emotions of Kollywood. We celebrate the soul of Indian fandom in all its regional glory.
                </p>
              </div>

              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-blue)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="fan-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-blue)', marginBottom: '16px', fontSize: '1.4rem' }}>Anime & Pop Culture</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  For the otakus and geeks. We weave the vibrant art styles, intense battles, and profound philosophies of your favorite anime universes into everyday streetwear. Express your true self.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Inspirations Grid */}
        <section className="section fandom-inspiration-stage">
          <div className="container">
            <div className="section-header">
              <p className="section-subtitle">Our PRIDE</p>
              <h2 className="section-title">FANDOM & LEGACY</h2>
              <div className="section-divider" />
            </div>
            <div className="fandom-insp-grid">
              {inspirations.map((item, i) => {
                const isDarkBg = item.color === 'var(--bauhaus-red)' || item.color === 'var(--bauhaus-blue)' || item.color === 'var(--bauhaus-green)' || item.color === 'var(--bauhaus-black)';
                
                return (
                  <motion.div
                    key={i}
                    className="fandom-insp-card glass-card fandomtic-panel"
                    initial={{ opacity: 0, y: 36, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: item.color }}
                  >
                    <div 
                      className="fandom-insp-icon" 
                      style={{ 
                        background: 'var(--bauhaus-black)',
                        border: '2px solid var(--bauhaus-black)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <item.icon 
                        size={28} 
                        color={'var(--bauhaus-white)'} 
                      />
                    </div>
                    <h3 className="heading-sm" style={{ color: isDarkBg ? 'var(--bauhaus-white)' : 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: isDarkBg ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}>
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Poem Grid */}
        <section className="section fandom-poem-stage" style={{ paddingBottom: '100px' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-subtitle">The Emotion</p>
              <h2 className="section-title">Fandom Is...</h2>
              <div className="section-divider" />
            </div>
            <div className="fandom-insp-grid">
              {fandomPoem.map((item, i) => {
                const isDarkBg = item.color === 'var(--bauhaus-red)' || item.color === 'var(--bauhaus-blue)' || item.color === 'var(--bauhaus-green)' || item.color === 'var(--bauhaus-black)';
                return (
                  <motion.div
                    key={i}
                    className="fandom-insp-card glass-card fandomtic-panel"
                    initial={{ opacity: 0, y: 36, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 2) * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: item.color }}
                  >
                    <p style={{ 
                      color: isDarkBg ? 'var(--bauhaus-white)' : 'var(--text-primary)', 
                      fontSize: '1.25rem',
                      lineHeight: '1.8',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      margin: 0
                    }}>
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}
