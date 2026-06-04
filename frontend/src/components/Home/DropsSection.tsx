import { motion } from 'framer-motion';
import ProductCard from '../ProductCard/ProductCard';
import { cinematicStagger, cinematicItem } from '../AnimatedPage';

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

interface DropsSectionProps {
  drops: Product[];
}

export default function DropsSection({ drops }: DropsSectionProps) {
  return (
    <section className="section drops-section" id="drops-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={cinematicStagger}
        >
          <motion.p className="section-subtitle" variants={cinematicItem}>Latest</motion.p>
          <motion.h2 className="section-title" variants={cinematicItem}>
            NEW <span className="text-gradient">DROPS</span>
          </motion.h2>
          <motion.div className="section-divider" variants={cinematicItem} />
        </motion.div>
      </div>

      <div className="container">
        <div className="drops-grid">
          {drops.length > 0 ? (
            drops.map((product, i) => (
              <div className="drops-item" key={`drop-${product.id}-${i}`}>
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <div className="drops-item" key={`skel-${i}`}>
                <div className="skeleton-card" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

