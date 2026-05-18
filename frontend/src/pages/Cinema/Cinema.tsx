import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Film, Sparkles, Palette, Clapperboard } from 'lucide-react';
import AnimatedPage, { cinematicItem, cinematicStagger } from '../../components/AnimatedPage';
import './Cinema.css';

export default function Cinema() {
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.45]);

  const inspirations = [
    { title: 'The Character Within', desc: 'Where characters live in characters. Our designs embody the soul of iconic roles.', icon: Film, color: 'var(--bauhaus-yellow)' },
    { title: 'Excellence of Cinema', desc: 'Celebrating the legacy, action, drama, and pure emotion of TFI.', icon: Sparkles, color: 'var(--bauhaus-red)' },
    { title: 'Script & Typography', desc: 'Unique typography that speaks the language of our beautiful cinema.', icon: Palette, color: 'var(--bauhaus-blue)' },
    { title: 'Cinematic Glory', desc: 'From the silver screen to the streets, wearing the culture proudly.', icon: Clapperboard, color: 'var(--bauhaus-white)' },
  ];

  const cinemaPoem = [
    { text: 'Cinema is the one who cries,\nCinema is the one who smiles.', color: 'var(--bauhaus-yellow)' },
    { text: 'Cinema is the one who dances,\nCinema is the rhythm in every step.', color: 'var(--bauhaus-red)' },
    { text: 'Cinema is the one who feels,\nCinema is the heartbeat of emotions.', color: 'var(--bauhaus-blue)' },
    { text: 'Cinema is the one who fights,\nCinema is the courage within.', color: 'var(--bauhaus-white)' },
    { text: 'Cinema is the one who speaks,\nCinema is the power of every dialogue.', color: 'var(--bauhaus-yellow)' },
    { text: 'Cinema is the one who walks,\nCinema is the journey of dreams.', color: 'var(--bauhaus-red)' },
    { text: 'Cinema is the one who stands,\nCinema is the strength of stories.', color: 'var(--bauhaus-blue)' },
    { text: 'Cinema is the silence between words,\nCinema is the echo that stays forever.', color: 'var(--bauhaus-white)' },
    { text: 'Cinema is light in the darkness,\nCinema is life on the screen.', color: 'var(--bauhaus-yellow)' },
    { text: 'Cinema is not just seen…\nCinema is felt like heaven.', color: 'var(--bauhaus-red)' }
  ];

  return (
    <AnimatedPage>
      <div className="cinema-page" id="cinema-page">
        {/* Hero */}
        <section className="cinema-hero" ref={heroRef}>
          <motion.div className="cinema-hero-bg" style={{ y: heroY }} />
          <motion.div className="cinema-hero-vignette" style={{ opacity: heroOpacity }} />
          <div className="container cinema-hero-content">
            <motion.div
              style={{ y: heroContentY }}
              variants={cinematicStagger}
              initial="initial"
              animate="animate"
            >
              <span className="hero-tag" style={{ color: 'var(--bauhaus-black)', fontWeight: 700 }}><Film size={14} /> THE STORY OF CINEMA</span>
              <motion.h1 variants={cinematicItem} style={{ whiteSpace: 'nowrap', fontSize: 'clamp(1.4rem, 6vw, 5rem)', fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.1, margin: '12px 0' }}>
                <span style={{ color: 'var(--bauhaus-yellow)' }}>TELUGU</span>{' '}
                <span style={{ color: 'var(--bauhaus-red)' }}>FILM</span>{' '}
                <span style={{ color: 'var(--bauhaus-black)' }}>INDUSTRY</span>
              </motion.h1>
              <motion.p className="cinema-hero-desc" variants={cinematicItem}>
                Widely known as Tollywood, the Telugu film industry is a distinguished pillar of Indian cinema—celebrated for its rich storytelling, vibrant music, and artistic excellence. It gracefully bridges cultural heritage with modern, innovative filmmaking to leave a lasting global impression across generations.
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
              <h2 className="section-title">The Excellence of Cinema</h2>
              <div className="section-divider" />
            </div>
            <div className="cinema-philosophy">
              <p>
                At TFICLUB, we believe that the most powerful art comes from the stories that move us. 
                The unmatched aura of Telugu Film Industry, the dialogues that turn into anthems, 
                and the larger-than-life characters — these moments deserve to live forever.
              </p>
              <p>
                We capture the essence of these unwritten emotions through typography and layout excellence. 
                Each piece is a woven narrative of the films that defined generations, allowing you to 
                wear your pride and be a walking testament to cinematic greatness.
              </p>
            </div>
          </div>
        </motion.section>

        {/* The Legacy of TFI */}
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
              <p className="section-subtitle" style={{ color: 'var(--bauhaus-yellow)' }}>The Phenomenon</p>
              <h2 className="section-title" style={{ color: 'var(--bauhaus-white)' }}>What is Tollywood?</h2>
              <div className="section-divider" style={{ background: 'var(--bauhaus-white)' }} />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '30px',
              marginTop: '40px'
            }}>
              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-red)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="tfi-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-red)', marginBottom: '16px', fontSize: '1.4rem' }}>The 'Mass' Culture</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  In Telugu cinema, "Mass" isn't just an audience—it's an emotion. It's the high-octane background scores, gravity-defying action, and punch dialogues that echo in theaters long after the movie ends. It is unapologetic, raw, and full of swagger.
                </p>
              </div>

              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-yellow)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="tfi-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-yellow)', marginBottom: '16px', fontSize: '1.4rem' }}>A Global Canvas</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  What started as a regional powerhouse has now commanded the world's attention. With Oscar-winning music, breathtaking visual effects, and epics that transcend language, Tollywood has redefined the scale of Indian storytelling on the global stage.
                </p>
              </div>

              <div style={{ padding: '30px', border: '2px solid var(--bauhaus-blue)', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s ease' }} className="tfi-info-card">
                <h3 className="heading-sm" style={{ color: 'var(--bauhaus-blue)', marginBottom: '16px', fontSize: '1.4rem' }}>Unmatched Fandom</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  The release of a superstar's movie is a festival. From 100-foot cutouts to theaters erupting in confetti and non-stop cheers, the fans breathe life into cinema. At TFICLUB, we design our apparel explicitly for this burning passion.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Inspirations Grid */}
        <section className="section cinema-inspiration-stage">
          <div className="container">
            <div className="section-header">
              <p className="section-subtitle">Our PRIDE</p>
              <h2 className="section-title">CINEMA & LEGACY</h2>
              <div className="section-divider" />
            </div>
            <div className="cinema-insp-grid">
              {inspirations.map((item, i) => {
                const isDarkBg = item.color === 'var(--bauhaus-red)' || item.color === 'var(--bauhaus-blue)';
                
                return (
                  <motion.div
                    key={i}
                    className="cinema-insp-card glass-card cinematic-panel"
                    initial={{ opacity: 0, y: 36, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: item.color }}
                  >
                    <div 
                      className="cinema-insp-icon" 
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
        <section className="section cinema-poem-stage" style={{ paddingBottom: '100px' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-subtitle">The Emotion</p>
              <h2 className="section-title">Cinema Is...</h2>
              <div className="section-divider" />
            </div>
            <div className="cinema-insp-grid">
              {cinemaPoem.map((item, i) => {
                const isDarkBg = item.color === 'var(--bauhaus-red)' || item.color === 'var(--bauhaus-blue)';
                return (
                  <motion.div
                    key={i}
                    className="cinema-insp-card glass-card cinematic-panel"
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
