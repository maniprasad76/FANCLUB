import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Magnetic } from '../Magnetic';
import { cinematicStagger, cinematicItem } from '../AnimatedPage';
import { formatImageUrl } from '../../lib/utils';

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

interface ShowcaseSectionProps {
  featured: Product[];
}

export default function ShowcaseSection({ featured }: ShowcaseSectionProps) {
  return (
    <section className="section showcase-section" id="showcase-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={cinematicStagger}
        >
          <motion.p className="section-subtitle" variants={cinematicItem}>Curated</motion.p>
          <motion.h2 className="section-title" variants={cinematicItem}>
            THE <span className="text-gradient">COLLECTION</span>
          </motion.h2>
          <motion.div className="section-divider" variants={cinematicItem} />
        </motion.div>

        <div className="showcase-grid">
          {featured.length > 0 ? (
            featured.map((product, i) => (
              <motion.div
                className="showcase-item"
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Corner decoration — rotate through primary colors */}
                <div className={`showcase-corner showcase-corner-${['red', 'blue', 'yellow'][i % 3]}`} />
                <Link to={`/product/${product.slug}`} className="showcase-link">
                  <div className="showcase-image-wrap">
                    <img
                      src={formatImageUrl(product.images?.[0]) || 'https://placehold.co/600x800/F0F0F0/121212?text=FAN'}
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
                    <span className="showcase-price">₹{product.price?.toLocaleString('en-IN')}</span>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="showcase-item" key={`skel-${i}`}>
                <div className="skeleton-card showcase-skeleton" />
              </div>
            ))
          )}
        </div>

        <motion.div
          className="section-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Magnetic strength={0.3}>
            <Link to="/shop" className="btn btn-outline btn-lg" id="showcase-view-all">
              View All <ArrowRight size={14} />
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

