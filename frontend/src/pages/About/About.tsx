import { motion } from 'framer-motion';

import AnimatedPage from '../../components/AnimatedPage';
import SEOHead from '../../components/SEOHead';

export default function About() {


  return (
    <AnimatedPage>
      <SEOHead
        title="About FANCLUB — Our Story | Cinema-Inspired Streetwear Brand"
        description="FANCLUB is a passion-driven streetwear brand celebrating cinema, anime, and pop culture. Learn about our journey, values, and vision."
        keywords="FANCLUB about, streetwear brand India, cinema fashion story, Tollywood merchandise brand"
      />
      <div style={{ paddingTop: 'var(--nav-height)', background: 'var(--bg-primary)' }} id="about-page">
        {/* HERO SECTION */}
        <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', borderBottom: '4px solid var(--bauhaus-black)' }}>
          {/* Geometric decorations */}
          <div style={{ position: 'absolute', top: '10%', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--bauhaus-red)', opacity: 0.15 }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '-50px', width: '200px', height: '200px', background: 'var(--bauhaus-yellow)', opacity: 0.15, transform: 'rotate(45deg)' }} />

          <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="hero-tag" style={{ color: 'var(--bauhaus-black)', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', border: '2px solid var(--bauhaus-black)', padding: '6px 16px', display: 'inline-block', marginBottom: '20px' }}>
                About FAN
              </span>
              <h1 className="heading-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--bauhaus-black)', fontSize: 'clamp(2.5rem, 10vw, 6rem)', lineHeight: 0.9, textTransform: 'uppercase' }}>
                PASSION & <span style={{ color: 'var(--bauhaus-blue)' }}>VISION</span>
              </h1>
              <p style={{ maxWidth: 700, margin: '30px auto 0', color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1.8, fontWeight: 400, fontFamily: 'var(--font-body)' }}>
                FANCLUB is not just a brand—it is a reflection of passion, dedication, and an unwavering belief in dreams. Built with a vision to inspire and create, FANCLUB represents the spirit of perseverance and creativity that drives us forward every day.
              </p>
            </motion.div>
          </div>
        </section>

        {/* STORY / JOURNEY SECTION */}
        <section className="section" style={{ background: 'var(--bauhaus-black)', color: 'var(--bauhaus-white)', padding: '100px 0' }}>
          <div className="container" style={{ maxWidth: '800px' }}>
            <div className="section-header" style={{ borderColor: 'var(--bauhaus-white)' }}>
              <p className="section-subtitle" style={{ color: 'var(--bauhaus-yellow)' }}>About FAN</p>
              <h2 className="section-title" style={{ color: 'var(--bauhaus-white)' }}>Our Journey</h2>
              <div className="section-divider" style={{ background: 'var(--bauhaus-white)' }} />
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px',
              marginTop: '50px'
            }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ padding: '32px', border: '2px solid var(--bauhaus-red)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}
              >
                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  Our journey has not been an easy one. Starting this path came with numerous challenges and uncertainties. We faced many struggles, financial constraints, and moments that tested our determination.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ padding: '32px', border: '2px solid var(--bauhaus-yellow)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}
              >
                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  However, through hard work, resilience, and countless sacrifices, we continued to move forward with faith and commitment. Every step of this journey has shaped who we are today.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ padding: '32px', border: '2px solid var(--bauhaus-blue)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}
              >
                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  What began as a difficult start has now grown into a meaningful pursuit, driven by passion and purpose. We believe that every challenge carries a lesson, and every sacrifice brings us closer to our vision.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ padding: '32px', border: '2px solid var(--bauhaus-white)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}
              >
                <p style={{ fontSize: '1.3rem', lineHeight: 1.8, color: 'var(--bauhaus-white)', fontWeight: 400, fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-editorial)' }}>
                  "This is not just our story—it is a journey of growth, strength, and the courage to keep going, no matter the obstacles."
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}
