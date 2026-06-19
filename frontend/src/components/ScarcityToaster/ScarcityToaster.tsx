import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../../lib/api';
import './ScarcityToaster.css';

// Exact real product list matching backend/scripts/direct-seed.js
const FALLBACK_PRODUCTS = [
  { name: 'Pushpa Iconic Dialogue Tee', price: 799 },
  { name: 'Baahubali Crown Tee', price: 899 },
  { name: 'RRR Fire & Water Tee', price: 849 },
  { name: 'Arjun Reddy Vintage Hoodie', price: 1899 },
  { name: 'Eega Minimal Hoodie', price: 1799 },
  { name: 'Tollywood Classics Hoodie', price: 1999 },
  { name: 'Kalki 2898 AD Oversized Tee', price: 999 },
  { name: 'Jersey Nani Oversized Tee', price: 949 },
  { name: 'Mahanati Art Oversized Tee', price: 1049 },
  { name: 'FAN Classic Snapback', price: 599 },
  { name: 'Cinema Director Cap', price: 649 },
  { name: 'Tollywood Star Trucker Cap', price: 549 },
  { name: 'Pushpa Theatrical Poster', price: 399 },
  { name: 'RRR Naacho Naacho Art Print', price: 449 },
  { name: 'Baahubali Kingdom Poster', price: 499 },
  { name: 'FAN Dialogue Sticker Pack', price: 199 },
  { name: 'Cinema Icons Sticker Set', price: 249 }
];

const CITIES = [
  'Hyderabad',
  'Vizag',
  'Vijayawada',
  'Guntur',
  'Tirupati',
  'Nellore',
  'Warangal',
  'Kurnool',
  'Secunderabad',
  'Bengaluru',
  'Chennai',
  'Kakinada',
  'Rajahmundry',
  'Anantapur'
];

interface ToastData {
  id: string;
  type: 'scarcity' | 'social' | 'views' | 'success';
  label: string;
  icon: string;
  message: React.ReactNode;
}

export default function ScarcityToaster() {
  const [products, setProducts] = useState<Array<{ name: string; price: number }>>(FALLBACK_PRODUCTS);
  const [recentPurchases, setRecentPurchases] = useState<Array<{ id: string; purchaserName: string; productName: string; city: string; createdAt: string }>>([]);
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  // History tracking refs to prevent duplicate types or products showing consecutively
  const productHistoryRef = useRef<string[]>([]);
  const typeHistoryRef = useRef<string[]>([]);
  const cityHistoryRef = useRef<string[]>([]);
  const purchaseHistoryRef = useRef<string[]>([]);

  // Fetch real products from backend to ensure alignment with active database
  useEffect(() => {
    api.get('/products', { params: { limit: 100 } })
      .then(res => {
        if (res.data && Array.isArray(res.data.products) && res.data.products.length > 0) {
          const fetched = res.data.products.map((p: any) => ({
            name: p.name,
            price: p.price
          }));
          setProducts(fetched);
        }
      })
      .catch(() => {
        // Fallback silently to static list on network error / offline dev server
      });
  }, []);

  // Fetch real recent customer orders from backend
  const fetchRecentPurchases = () => {
    api.get('/orders/public/recent')
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setRecentPurchases(res.data);
        }
      })
      .catch(() => {
        // Fallback silently if API is offline
      });
  };

  useEffect(() => {
    fetchRecentPurchases();
    // Poll every 5 minutes to fetch new real purchases
    const interval = setInterval(fetchRecentPurchases, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Scarcity notification loop
  useEffect(() => {
    let hideTimeoutId: any;
    let nextToastTimeoutId: any;

    const triggerNext = () => {
      if (products.length === 0) return;

      // 1. Pick a product ensuring no recent duplicates
      let availableProducts = products.filter(p => !productHistoryRef.current.includes(p.name));
      if (availableProducts.length === 0) {
        productHistoryRef.current = [];
        availableProducts = products;
      }
      const selectedProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      
      // Update product history (keep last 5)
      productHistoryRef.current = [...productHistoryRef.current.slice(-4), selectedProduct.name];

      // 2. Pick a notification type ensuring no recent duplicates
      const types = ['stock', 'demand', 'purchase', 'cart', 'views'];
      let availableTypes = types.filter(t => !typeHistoryRef.current.includes(t));
      if (availableTypes.length === 0) {
        typeHistoryRef.current = [];
        availableTypes = types;
      }
      const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      typeHistoryRef.current = [...typeHistoryRef.current.slice(-1), selectedType];

      // 3. Pick a city ensuring no recent duplicates
      let availableCities = CITIES.filter(c => !cityHistoryRef.current.includes(c));
      if (availableCities.length === 0) {
        cityHistoryRef.current = [];
        availableCities = CITIES;
      }
      const selectedCity = availableCities[Math.floor(Math.random() * availableCities.length)];
      cityHistoryRef.current = [...cityHistoryRef.current.slice(-3), selectedCity];

      // 4. Generate notification details based on type
      let toastData: ToastData;

      switch (selectedType) {
        case 'stock': {
          const stock = Math.floor(Math.random() * 4) + 2; // 2 to 5 left
          toastData = {
            id: String(Date.now()),
            type: 'scarcity',
            label: 'Limited Stock',
            icon: '⚠️',
            message: (
              <>
                Only <span className="scarcity-toast-highlight">{stock} left</span> of <span className="scarcity-toast-product">{selectedProduct.name}</span>!
              </>
            )
          };
          break;
        }
        case 'demand':
          toastData = {
            id: String(Date.now()),
            type: 'scarcity',
            label: 'Selling Fast',
            icon: '🔥',
            message: (
              <>
                High Demand: <span className="scarcity-toast-product">{selectedProduct.name}</span> is almost sold out!
              </>
            )
          };
          break;
        case 'purchase': {
          if (recentPurchases.length > 0) {
            let availablePurchases = recentPurchases.filter(p => !purchaseHistoryRef.current.includes(p.id));
            if (availablePurchases.length === 0) {
              purchaseHistoryRef.current = [];
              availablePurchases = recentPurchases;
            }
            const selectedPurchase = availablePurchases[Math.floor(Math.random() * availablePurchases.length)];
            purchaseHistoryRef.current = [...purchaseHistoryRef.current.slice(-4), selectedPurchase.id];

            toastData = {
              id: String(Date.now()),
              type: 'success',
              label: 'Verified Purchase',
              icon: '👤',
              message: (
                <>
                  <span className="scarcity-toast-highlight">{selectedPurchase.purchaserName}</span> in <span className="scarcity-toast-highlight">{selectedPurchase.city}</span> just bought <span className="scarcity-toast-product">{selectedPurchase.productName}</span>!
                </>
              )
            };
          } else {
            const simulatedNames = ['Ramesh', 'Suresh', 'Anitha', 'Priya', 'Rahul', 'Nikhil', 'Divya', 'Vikram', 'Sneha', 'Karthik'];
            const randomName = simulatedNames[Math.floor(Math.random() * simulatedNames.length)];
            toastData = {
              id: String(Date.now()),
              type: 'success',
              label: 'Recent Purchase',
              icon: '👤',
              message: (
                <>
                  <span className="scarcity-toast-highlight">{randomName}</span> in <span className="scarcity-toast-highlight">{selectedCity}</span> just bought <span className="scarcity-toast-product">{selectedProduct.name}</span>!
                </>
              )
            };
          }
          break;
        }
        case 'cart': {
          const cartCount = Math.floor(Math.random() * 9) + 4; // 4 to 12 people
          toastData = {
            id: String(Date.now()),
            type: 'social',
            label: 'Popular Choice',
            icon: '🛒',
            message: (
              <>
                <span className="scarcity-toast-number">{cartCount} people</span> added <span className="scarcity-toast-product">{selectedProduct.name}</span> to their cart in the last hour!
              </>
            )
          };
          break;
        }
        case 'views':
        default: {
          const viewCount = Math.floor(Math.random() * 34) + 15; // 15 to 48 people
          toastData = {
            id: String(Date.now()),
            type: 'views',
            label: 'Trending Now',
            icon: '👀',
            message: (
              <>
                <span className="scarcity-toast-number">{viewCount} users</span> are viewing <span className="scarcity-toast-product">{selectedProduct.name}</span> right now!
              </>
            )
          };
          break;
        }
      }

      setCurrentToast(toastData);
      setVisible(true);

      // Hide toast after 6 seconds
      hideTimeoutId = setTimeout(() => {
        setVisible(false);
      }, 6000);

      // Trigger the next one strictly 28 seconds later
      nextToastTimeoutId = setTimeout(triggerNext, 28000);
    };

    // Initial delay: wait 12 seconds before firing the very first toast so it doesn't clash with brand intro
    nextToastTimeoutId = setTimeout(triggerNext, 12000);

    return () => {
      clearTimeout(hideTimeoutId);
      clearTimeout(nextToastTimeoutId);
    };
  }, [products, recentPurchases]);

  return (
    <div className="scarcity-toast-container">
      <AnimatePresence mode="wait">
        {visible && currentToast && (
          <motion.div
            key={currentToast.id}
            className={`scarcity-toast-card ${currentToast.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div className={`scarcity-toast-icon ${currentToast.type}`}>
              {currentToast.icon}
            </div>
            
            <div className="scarcity-toast-content">
              <span className="scarcity-toast-label">{currentToast.label}</span>
              <p className="scarcity-toast-message">{currentToast.message}</p>
            </div>

            <button 
              className="scarcity-toast-close" 
              onClick={() => setVisible(false)}
              aria-label="Dismiss notification"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
