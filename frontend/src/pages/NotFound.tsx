import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

export default function NotFound() {
  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--container-padding)', background: 'var(--bauhaus-black)' }} id="not-found-page">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          style={{
            position: 'relative',
            padding: '40px',
            background: 'var(--bauhaus-white)',
            border: '8px solid var(--bauhaus-black)',
            boxShadow: '16px 16px 0px 0px var(--bauhaus-red)'
          }}
        >
          {/* Decorative Blocks */}
          <div style={{ position: 'absolute', top: '-16px', left: '-16px', width: '32px', height: '32px', background: 'var(--bauhaus-blue)', border: '4px solid var(--bauhaus-black)' }} />
          <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', width: '48px', height: '48px', background: 'var(--bauhaus-yellow)', border: '4px solid var(--bauhaus-black)', borderRadius: '50%' }} />

          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(6rem, 15vw, 12rem)', 
            lineHeight: 1, 
            color: 'var(--bauhaus-black)',
            margin: 0,
            textShadow: '8px 8px 0px var(--bauhaus-blue)'
          }}>
            404
          </h1>
          <h2 style={{ 
            fontFamily: 'var(--font-accent)', 
            fontSize: '2rem',
            textTransform: 'uppercase',
            fontWeight: 900,
            color: 'var(--bauhaus-red)',
            marginBottom: '16px',
            letterSpacing: '2px'
          }}>
            Off the Grid
          </h2>
          <p style={{ 
            maxWidth: 400, 
            margin: '0 auto 32px',
            color: 'var(--bauhaus-black)',
            fontWeight: 600,
            fontSize: '1.1rem'
          }}>
            The collection you're looking for doesn't exist in our current construct. Let's get you back to the main timeline.
          </p>
          <Link 
            to="/" 
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'var(--bauhaus-black)',
              color: 'var(--bauhaus-yellow)',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              textTransform: 'uppercase',
              textDecoration: 'none',
              letterSpacing: '2px',
              border: '4px solid var(--bauhaus-black)',
              transition: 'all 0.2s',
              boxShadow: '6px 6px 0px 0px var(--bauhaus-blue)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '8px 8px 0px 0px var(--bauhaus-blue)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px 0px var(--bauhaus-blue)';
            }}
          >
            Back to Shop
          </Link>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
