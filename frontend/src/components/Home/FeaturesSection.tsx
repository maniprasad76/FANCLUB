import { motion } from 'framer-motion';
import { Shield, Truck, RotateCcw, Headphones } from 'lucide-react';
import { cinematicStagger, cinematicItem } from '../AnimatedPage';

const FEATURES = [
  { icon: Shield, label: 'Secure Payment', color: 'red' },
  { icon: Truck, label: 'Free Shipping', color: 'blue' },
  { icon: RotateCcw, label: 'Easy Returns', color: 'yellow' },
  { icon: Headphones, label: '24/7 Support', color: 'red' },
];

export default function FeaturesSection() {
  return (
    <motion.section
      className="section features-section"
      id="features-section"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.4 }}
      variants={cinematicStagger}
    >
      <div className="container">
        <div className="features-row">
          {FEATURES.map(({ icon: Icon, label, color }) => (
            <motion.div
              className={`feature-card feature-card-${color}`}
              key={label}
              variants={cinematicItem}
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
      </div>
    </motion.section>
  );
}

