import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Store, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './MobileBottomNav.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/shop', icon: Store, label: 'Shop' },
  { path: '/wishlist', icon: Heart, label: 'Wishlist' },
  { path: '/cart', icon: ShoppingBag, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Account' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { count } = useCart();

  return (
    <nav className="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="mobile-bottom-nav-inner">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-pill"
                  className="mobile-nav-active-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="mobile-nav-icon-wrap">
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                {label === 'Cart' && count > 0 && (
                  <span className="mobile-cart-badge">{count > 99 ? '99+' : count}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
