import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { Magnetic } from "../../components/Magnetic";
import AnimatedPage, {
  fandomticItem,
  fandomticStagger,
} from "../../components/AnimatedPage";
import ProductShowcase from "../../components/ProductShowcase/ProductShowcase";
import SEOHead from "../../components/SEOHead";
import api, { SOCIAL_LINKS } from "../../lib/api";
import { formatImageUrl } from "../../lib/utils";
import "./Home.css";
import { useDevice } from "../../context/DeviceContext";

/* ─── types ─── */
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  category?: { name: string; slug: string };
  newArrival?: boolean;
  bestseller?: boolean;
}

/* ─── constants ─── */
const FEATURES = [
  { icon: Shield, label: "Secure Payment", color: "red" },
  { icon: Truck, label: "Free Shipping", color: "blue" },
  { icon: RotateCcw, label: "Easy Returns", color: "yellow" },
  { icon: Headphones, label: "24/7 Support", color: "green" },
];

export default function Home() {
  const { isMobile } = useDevice();
  const heroRef = useRef<HTMLElement>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Product[]>([]);
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  /* parallax */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroBgY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* fetch products & config */
  const fetchData = useCallback(async () => {
    try {
      const [featuredRes, dropsRes, aboutImgRes, heroImgRes] =
        await Promise.all([
          api.get("/products/featured").catch(() => ({ data: {} })),
          api.get("/products?sort=newest&limit=12").catch(() => ({ data: {} })),
          api.get("/settings/about-image").catch(() => ({ data: {} })),
          api.get("/settings/hero-images").catch(() => ({ data: {} })),
        ]);
      setFeatured(featuredRes.data?.products || featuredRes.data || []);
      setDrops(dropsRes.data?.products || dropsRes.data || []);
      if (aboutImgRes.data?.url) setAboutImage(aboutImgRes.data.url);
      if (heroImgRes.data?.urls) setHeroImages(heroImgRes.data.urls);
    } catch {
      /* silent — skeletons will show */
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [heroImages]);

  /* products ready to display */

  return (
    <AnimatedPage className="home-page">
      <SEOHead
        title="FANCLUB — Fandom-Inspired Streetwear | Wear the Culture"
        description="Premium streetwear celebrating Telugu Film Industry culture. Shop fandom-inspired t-shirts, hoodies & accessories. Free shipping & taxes included."
        keywords="FANCLUB, Telugu film merch, fandom fashion, anime streetwear, pop culture clothing, Tollywood merchandise"
      />

      {/* ════════════════════════════════════════════
          1. HERO — Bauhaus Constructivist
         ════════════════════════════════════════════ */}
      <section className="hero" id="hero-section" ref={heroRef} style={isMobile ? { minHeight: "85vh", height: "85vh" } : {}}>
        {/* Background media */}
        <motion.div
          className="hero-bg"
          style={isMobile ? {} : { y: heroBgY, scale: heroScale }}
        >
          {heroImages.length > 0 ? (
            heroImages.map((imgUrl, idx) => (
              <img
                key={idx}
                src={formatImageUrl(imgUrl)}
                alt={`Hero ${idx + 1}`}
                className={`hero-carousel-img full-screen ${idx === currentHeroIndex ? "active" : ""}`}
                fetchPriority={idx === 0 ? "high" : "low"}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding={idx === 0 ? "sync" : "async"}
              />
            ))
          ) : (
            <img
              className="hero-media"
              src="/assets/hero-banner.jpg"
              alt="FANCLUB"
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="hero-gradient-overlay" />
        </motion.div>

        {/* Content */}
        {isMobile ? (
          <div 
            className="hero-content container" 
            style={{ 
              position: "absolute", 
              zIndex: 10, 
              bottom: "40px", 
              left: "0", 
              right: "0", 
              textAlign: "center", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              padding: "0 24px"
            }}
          >
            <h1 className="font-display" style={{ fontSize: "2.5rem", fontWeight: 900, textTransform: "uppercase", color: "var(--bauhaus-white)", textShadow: "2px 2px 0px var(--bauhaus-black)", letterSpacing: "1px", marginBottom: "8px" }}>
              FANCLUB
            </h1>
            <p className="font-accent" style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--bauhaus-yellow)", letterSpacing: "1.5px", marginBottom: "20px" }}>
              Wear the Culture
            </p>
            <Link to="/shop" className="btn btn-primary" style={{ background: "var(--bauhaus-red)", border: "3px solid var(--bauhaus-black)", boxShadow: "4px 4px 0 var(--bauhaus-black)", borderRadius: 0 }}>
              Shop Latest Drops
            </Link>
          </div>
        ) : (
          <motion.div
            className="hero-content container"
            style={{ opacity: heroOpacity }}
            variants={fandomticStagger}
            initial="initial"
            animate="animate"
          ></motion.div>
        )}

        {/* Scroll indicator */}
        {!isMobile && (
          <div className="hero-scroll-cue">
            <div className="scroll-line" />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════
          1.5. INFINITE TEXT MARQUEE
         ════════════════════════════════════════════ */}
      <div className="text-marquee-container">
        <div className="text-marquee-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`tm-${i}`} className="text-marquee-content">
              <span>BE YOUR OWN STYLE</span>
              <span className="marquee-shape">✦</span>
              <span>FANDOM DROPS</span>
              <span className="marquee-shape">✦</span>
              <span>FANCLUB</span>
              <span className="marquee-shape">✦</span>
              <span>FEEL THE DESIGNS</span>
              <span className="marquee-shape">✦</span>
              <span>FANDOM CULTURE</span>
              <span className="marquee-shape">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          2. CLEAN PRODUCT SHOWCASE & OUR BLOG
         ════════════════════════════════════════════ */}
      <ProductShowcase initialProducts={drops} subtitle="Latest" />


      {/* ════════════════════════════════════════════
          3. SOCIAL CONNECTIONS — Yellow Color Block
         ════════════════════════════════════════════ */}
      <motion.section
        className="section delivery-section"
        id="social-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={fandomticStagger}
      >
        {/* Corner decorations */}
        <div className="bauhaus-corner bauhaus-corner-tl" />
        <div className="bauhaus-corner bauhaus-corner-br" />

        <div className="container delivery-content">
          <motion.div className="social-icons-row" variants={fandomticStagger}>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap social-whatsapp"
              aria-label="WhatsApp"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-23.1-115.1-65.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.9 18.3L72 334.8l-4.4-7c-18.4-29.3-28.1-63.5-28.1-98.8 0-101.4 82.6-184 184.2-184 49.1 0 95.3 19.1 130 53.8 34.7 34.7 53.8 81 53.8 130 0 101.5-82.6 184.1-183.6 184.1v-.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18.1-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18.1-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.9-16.5-54.4-28-76.8-67-2.3-4.1-.2-6.3 1.2-7.7 1.2-1.2 2.8-3.2 4.1-4.8 1.4-1.6 1.9-2.8 2.8-4.7 1.1-2.1.5-3.9-.4-5.3-1.1-1.6-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.3-.2-7.1-.2-10.8-.2-3.7 0-9.8 1.4-14.9 6.9-5.1 5.6-19.5 19-19.5 46.3s20 53.6 22.8 57.3c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.6-2.5-5.3-3.9-10.8-6.7z" />
              </svg>
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap social-instagram"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap social-youtube"
              aria-label="YouTube"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
              </svg>
            </a>
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap social-twitter"
              aria-label="Twitter"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.792 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.792-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
              </svg>
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-wrap social-facebook"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M400 32H48A16 16 0 0 0 32 48v416a16 16 0 0 0 16 16h214.6V300.6h-59.5v-69h59.5v-51.4c0-58.9 36-91 88.6-91 25.2 0 46.9 1.9 53.2 2.7v61.7h-36.5c-28.6 0-34.1 13.6-34.1 33.5v44.5h68.3l-8.9 69h-59.4V480H400a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" />
              </svg>
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          4. PRODUCT SHOWCASE — Grid with Hard Shadows
         ════════════════════════════════════════════ */}
      <section className="section showcase-section" id="showcase-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={fandomticStagger}
          >
            <motion.p className="section-subtitle" variants={fandomticItem}>
              Curated
            </motion.p>
            <motion.h2 className="section-title" variants={fandomticItem}>
              THE <span className="text-gradient">COLLECTION</span>
            </motion.h2>
            <motion.div className="section-divider" variants={fandomticItem} />
          </motion.div>

          <div className={isMobile ? "mobile-swipe-carousel" : "showcase-grid"}>
            {featured.length > 0
              ? featured.map((product, i) => (
                  <motion.div
                    className={isMobile ? "mobile-swipe-item" : "showcase-item"}
                    key={product.id}
                    initial={isMobile ? undefined : { opacity: 0, y: 40 }}
                    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                    whileHover={isMobile ? undefined : { y: -6 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {/* Corner decoration — rotate through primary colors */}
                    <div
                      className={`showcase-corner showcase-corner-${["red", "blue", "yellow"][i % 3]}`}
                    />
                    <Link
                      to={`/product/${product.slug}`}
                      className="showcase-link"
                    >
                      <div className="showcase-image-wrap">
                        <img
                          src={
                            formatImageUrl(product.images?.[0]) ||
                            "https://placehold.co/600x800/F0F0F0/121212?text=FAN"
                          }
                          alt={product.name}
                          className="showcase-image"
                          loading="lazy"
                        />
                        <div className="showcase-overlay">
                          <span className="showcase-view">View</span>
                        </div>
                      </div>
                      <div className="showcase-info">
                        <h3 className="showcase-name">{product.name}</h3>
                        <span className="showcase-price">
                          ₹{product.price?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div className={isMobile ? "mobile-swipe-item" : "showcase-item"} key={`skel-${i}`}>
                    <div className="skeleton-card showcase-skeleton" style={isMobile ? { height: "320px" } : {}} />
                  </div>
                ))}
          </div>

          <motion.div
            className="section-cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Magnetic strength={0.3}>
              <Link
                to="/shop"
                className="btn btn-outline btn-lg"
                id="showcase-view-all"
                style={{ borderRadius: 0 }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </Magnetic>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          5. ABOUT — Bauhaus Blue Panel
         ════════════════════════════════════════════ */}
      <motion.section
        className="section about-section"
        id="about-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={fandomticStagger}
      >
        <div className="container about-grid">
          <motion.div className="about-text" variants={fandomticItem}>
            <p className="section-subtitle">The Story</p>
            <h2 className="about-title">
              STREETWEAR <br />
              AS <span className="text-gradient">FANDOM</span>
            </h2>
            <p className="about-body">
              Every thread tells a story. Dedicated to the Telugu Film Industry,
              its legendary characters, and fandomtic masterpieces — FANCLUB
              blends our rich cultural heritage with premium aesthetics. We
              don't just make clothes. We craft scenes you can wear.
            </p>
            <Magnetic strength={0.3}>
              <Link
                to="/about"
                className="btn btn-secondary btn-lg"
                id="about-cta"
                style={{ borderRadius: 0 }}
              >
                Our Story <ArrowRight size={14} />
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div className="about-visual" variants={fandomticItem}>
            <div className="about-visual-inner">
              {aboutImage ? (
                <img
                  src={formatImageUrl(aboutImage)}
                  alt="FAN Story"
                  className="about-image-custom"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--bauhaus-black)",
                    boxShadow: "16px 16px 0px 0px var(--bauhaus-yellow)",
                    border: "2px solid var(--bauhaus-black)",
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          6. PROJECT HYPE MARQUEE
         ════════════════════════════════════════════ */}
      <div className="text-marquee-container-accent">
        <div className="text-marquee-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`hype-tm-${i}`} className="text-marquee-content">
              <span>NEW FANDOM DROPS</span>
              <span className="marquee-shape">✦</span>
              <span>LIMITED EDITIONS</span>
              <span className="marquee-shape">✦</span>
              <span>WEAR THE CULTURE</span>
              <span className="marquee-shape">✦</span>
              <span>EXCLUSIVE TFI MERCH</span>
              <span className="marquee-shape">✦</span>
              <span>STAY CURIOUS</span>
              <span className="marquee-shape">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          7. FEATURES — Red Color Block
         ════════════════════════════════════════════ */}
      <motion.section
        className="section features-section"
        id="features-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.4 }}
        variants={fandomticStagger}
      >
        <div className="container">
          {isMobile ? (
            <div className="mobile-pills-row" style={{ padding: "0 0 16px 0", margin: 0 }}>
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <div
                  className={`feature-card feature-card-${color}`}
                  key={label}
                  style={{ flex: "0 0 180px", margin: 0, border: "2px solid var(--bauhaus-black)", display: "flex", gap: "8px", alignItems: "center", padding: "10px 14px", height: "auto" }}
                >
                  <div className="feature-icon-wrap" style={{ margin: 0, padding: "4px" }}>
                    <Icon size={16} />
                  </div>
                  <span className="feature-label" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="features-row">
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <motion.div
                  className={`feature-card feature-card-${color}`}
                  key={label}
                  variants={fandomticItem}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="feature-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <span className="feature-label">{label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </AnimatedPage>
  );
}
