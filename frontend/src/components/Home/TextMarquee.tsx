export default function TextMarquee() {
  return (
    <div className="text-marquee-container">
      <div className="text-marquee-track">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`tm-${i}`} className="text-marquee-content">
            <span>TELUGU FILM INDUSTRY</span>
            <span className="marquee-shape">✦</span>
            <span>CINEMA DROPS</span>
            <span className="marquee-shape">✦</span>
            <span>TFICLUB</span>
            <span className="marquee-shape">✦</span>
            <span>FEEL THE DESIGNS</span>
            <span className="marquee-shape">✦</span>
            <span>CINEMA CULTURE</span>
            <span className="marquee-shape">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
