import { Link, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './MobileBottomNav.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/shop', icon: Store, label: 'Shop' },
  { path: '/wishlist', icon: Heart, label: 'Wishlist' },
  { path: '/cart', icon: ShoppingBag, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { count } = useCart();

  return (
    <nav className="mobile-bottom-nav" id="mobile-bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          className={`mobile-nav-item ${location.pathname === path ? 'active' : ''}`}
          aria-label={label}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon size={24} strokeWidth={2.5} />
            {label === 'Cart' && <span className="mobile-cart-badge" style={{ visibility: count > 0 ? 'visible' : 'hidden' }}>{count}</span>}
          </div>
        </Link>
      ))}
    </nav>
  );
}
