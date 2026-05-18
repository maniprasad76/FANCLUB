import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './SocialProofToast.css';

/* ─── Realistic Indian names & cities ─── */
const NAMES = [
  'Rahul', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Divya', 'Karthik', 'Ananya',
  'Ravi', 'Meera', 'Varun', 'Pooja', 'Aditya', 'Lakshmi', 'Harsha', 'Nithya',
  'Suresh', 'Kavya', 'Mahesh', 'Sravani', 'Pavan', 'Deepika', 'Charan', 'Swathi',
];
const CITIES = [
  'Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Visakhapatnam', 'Vijayawada',
  'Warangal', 'Tirupati', 'Guntur', 'Delhi', 'Pune', 'Kochi', 'Coimbatore',
];
const TIME_AGO = [
  '2 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago',
  '15 minutes ago', '23 minutes ago', '30 minutes ago', '1 hour ago',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface SocialProofToastProps {
  /** Product names to rotate through */
  productNames?: string[];
  /** Interval range in ms [min, max] */
  interval?: [number, number];
}

/**
 * SocialProofToast — Shows rotating "X from Y just bought Z" notifications
 * Uses anchoring bias (specific names/cities) and social proof (bandwagon effect)
 * to build trust and urgency.
 */
export default function SocialProofToast({
  productNames = [],
  interval = [15000, 30000],
}: SocialProofToastProps) {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState({ name: '', city: '', product: '', timeAgo: '' });
  const timerRef = useRef<any>(null);
  const dismissRef = useRef<any>(null);
  const location = useLocation();

  // Hide on auth/checkout pages
  const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/checkout'];
  const isHidden = hiddenPaths.some(p => location.pathname.startsWith(p));

  const defaultProducts = [
    'Pushpa Rise Oversized Tee', 'RRR Warrior Hoodie', 'Baahubali Legacy Tee',
    'Arjun Reddy Raw Tee', 'Jersey Spirit Polo', 'Ala Vaikunthapurramuloo Vibe Tee',
    'Rangasthalam Classic Tee', 'Eega Spirit Tee', 'Mahanati Grace Tee',
  ];

  const allProducts = productNames.length > 0 ? productNames : defaultProducts;

  const showNotification = () => {
    setNotification({
      name: pick(NAMES),
      city: pick(CITIES),
      product: pick(allProducts),
      timeAgo: pick(TIME_AGO),
    });
    setVisible(true);

    // Auto-dismiss after 5 seconds
    dismissRef.current = setTimeout(() => setVisible(false), 5000);
  };

  useEffect(() => {
    // First notification after 8-12 seconds
    const initialDelay = 8000 + Math.random() * 4000;

    const startTimer = () => {
      const nextInterval = interval[0] + Math.random() * (interval[1] - interval[0]);
      timerRef.current = setTimeout(() => {
        showNotification();
        startTimer(); // Schedule next
      }, nextInterval);
    };

    const initialTimer = setTimeout(() => {
      showNotification();
      startTimer();
    }, initialDelay);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timerRef.current);
      clearTimeout(dismissRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && !isHidden && (
        <motion.div
          className="social-proof-toast"
          initial={{ opacity: 0, x: -120, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="spt-icon">
            <ShoppingBag size={18} />
          </div>
          <div className="spt-content">
            <p className="spt-text">
              <strong>{notification.name}</strong> from {notification.city}
            </p>
            <p className="spt-product">just purchased <strong>{notification.product}</strong></p>
            <p className="spt-time">{notification.timeAgo}</p>
          </div>
          <button className="spt-close" onClick={() => setVisible(false)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
