import { Link, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingBag, Flame, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './MobileBottomNav.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/shop', icon: Store, label: 'Shop' },
  { path: '/loyalty', icon: Flame, label: 'Club' },
  { path: '/cart', icon: ShoppingBag, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Account' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { count } = useCart();

  return (
    <nav className="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        return (
          <Link
            key={path}
            to={path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            aria-label={label}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label === 'Cart' && count > 0 && (
                <span className="mobile-cart-badge">{count > 99 ? '99+' : count}</span>
              )}
            </div>
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
