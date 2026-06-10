import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import { Search, ShoppingBag, Heart, User, Menu, X, Loader2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { Magnetic } from '../Magnetic';
import api from '../../lib/api';
import CartDrawer from '../CartDrawer/CartDrawer';
import './TopNav.css';

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 220], [0, 1]);
  const navBlur = useTransform(scrollY, [0, 220], [0, 0]);
  const navBorderOpacity = useTransform(scrollY, [0, 220], [0, 1]);
  const navBg = useMotionTemplate`rgba(var(--bg-rgb), ${navOpacity})`;
  const navBackdrop = useMotionTemplate`blur(${navBlur}px)`;
  const navBorder = useMotionTemplate`rgba(var(--border-rgb), ${navBorderOpacity})`;
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      api.get('/products', { params: { search: searchQuery, limit: 5 } })
        .then((res) => {
          setSearchResults(res.data.products || []);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <>
      <motion.nav
        className={`topnav ${scrolled ? 'scrolled' : ''}`}
        id="top-nav"
        style={{
          backgroundColor: navBg,
          backdropFilter: navBackdrop,
          WebkitBackdropFilter: navBackdrop,
          borderBottomColor: navBorder,
        }}
      >
        <div className="topnav-inner container">
          <div className="topnav-left">
            <Link to="/" className="topnav-logo" id="nav-logo">
              <span className="logo-box">FAN</span>
              <span className="logo-text-out">CLUB</span>
            </Link>
          </div>

          <div className="topnav-center desktop-only" onMouseLeave={() => setHoveredIndex(null)}>
            {[
              { name: 'Shop', path: '/shop' },
              { name: 'Fandom', path: '/fandom' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' }
            ].map((item, index) => (
              <Magnetic key={item.name}>
                <Link
                  to={item.path}
                  className={`nav-link interactive ${hoveredIndex !== null && hoveredIndex !== index ? 'dimmed' : ''}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  {item.name}
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.div
                        layoutId="menu-hover-block"
                        className="menu-hover-block"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </Magnetic>
            ))}
          </div>

          <div className="topnav-right">
            <Magnetic>
              <button className="btn-icon nav-icon-btn interactive" onClick={toggleTheme} id="nav-theme-btn">
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </Magnetic>
            <Magnetic>
              <button className="btn-icon nav-icon-btn interactive" onClick={() => setSearchOpen(!searchOpen)} id="nav-search-btn">
                <Search size={22} />
              </button>
            </Magnetic>
            <div className="desktop-only-icons flex-align-center">
              <Magnetic>
                <Link to="/wishlist" className="btn-icon nav-icon-btn interactive" id="nav-wishlist-btn">
                  <Heart size={22} />
                </Link>
              </Magnetic>
              <Magnetic>
                <button 
                  className="btn-icon nav-icon-btn cart-btn interactive" 
                  id="nav-cart-btn"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingBag size={22} />
                  {count > 0 && <span className="cart-badge">{count}</span>}
                </button>
              </Magnetic>
              {user ? (
                <div className="user-menu interactive">
                  <Magnetic>
                    <Link to="/profile" className="btn-icon nav-icon-btn" id="nav-profile-btn">
                      <User size={22} />
                    </Link>
                  </Magnetic>
                </div>
              ) : (
                <Magnetic>
                  <Link to="/login" className="btn btn-sm btn-primary interactive" id="nav-login-btn">Sign In</Link>
                </Magnetic>
              )}
            </div>
            <button className="topnav-menu-btn btn-icon" onClick={() => setMenuOpen(!menuOpen)} id="mobile-menu-btn">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className="search-overlay"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <form onSubmit={handleSearch} className="search-form container">
                <Search size={22} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for designs, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-input"
                  id="search-input"
                />
                <button type="button" className="btn-icon" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
                  <X size={22} />
                </button>
              </form>

              {searchQuery.trim() && (
                <div className="search-results-dropdown container">
                  {isSearching ? (
                    <div className="search-loading">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="search-results-list">
                      {searchResults.map((product) => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.slug}`} 
                          className="search-result-item"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <img src={product.images?.[0] || 'https://via.placeholder.com/50'} alt={product.name} className="search-result-img" />
                          <div className="search-result-info">
                            <h4 className="search-result-name">{product.name}</h4>
                            <p className="search-result-price">₹{product.price}</p>
                          </div>
                        </Link>
                      ))}
                      <button 
                        className="search-view-all"
                        onClick={(e) => handleSearch(e as any)}
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  ) : (
                    <div className="search-no-results">No results found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu open"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mobile-menu-links">
              <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
              <Link to="/fandom" onClick={() => setMenuOpen(false)}>Fandom</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              {user ? (
                <button onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
