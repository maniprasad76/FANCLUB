export default function UpcomingDropSection() {
  return (
    <div className="text-marquee-container" style={{ borderTop: '4px solid var(--bauhaus-black)', borderBottom: '4px solid var(--bauhaus-black)', background: 'var(--bauhaus-yellow)' }}>
      <div className="text-marquee-track">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`upcoming-marquee-${i}`} className="text-marquee-content" style={{ color: 'var(--bauhaus-black)' }}>
            <span>COMING SOON</span>
            <span className="marquee-shape">✦</span>
            <span>NEXT DROP</span>
            <span className="marquee-shape">✦</span>
            <span>STAY UPDATED</span>
            <span className="marquee-shape">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
