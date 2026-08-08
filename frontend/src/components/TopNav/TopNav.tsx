import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Loader2,
  Store,
  Flame,
  Zap,
  BookOpen,
  Phone,
  LogOut,
  LogIn,
  ChevronRight,
  History,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Magnetic } from "../Magnetic";
import api from "../../lib/api";
import CartDrawer from "../CartDrawer/CartDrawer";
import "./TopNav.css";

/** Popular searches shown as instant quick-filter chips. */
const TRENDING_SEARCHES = ["Pushpa", "RRR", "Baahubali", "Arjun Reddy"];

const RECENT_SEARCHES_KEY = "fan_recent_searches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string").slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string): string[] {
  const t = term.trim();
  if (!t) return loadRecentSearches();
  const next = [
    t,
    ...loadRecentSearches().filter(
      (x) => x.toLowerCase() !== t.toLowerCase(),
    ),
  ].slice(0, 8);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
  return next;
}

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [quickCategories, setQuickCategories] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load recent searches + category quick filters on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
    api
      .get("/categories")
      .then((r) => setQuickCategories(r.data || []))
      .catch(() => {});
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedIndex(-1);
  };

  const openProduct = (product: any) => {
    if (product?.name) saveRecentSearch(product.name);
    navigate(`/product/${product.slug}`);
    closeSearch();
  };

  // Global shortcut: Cmd/Ctrl+K toggles search, Escape closes, arrows navigate
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }
      if (!searchOpen) return;
      if (e.key === "Escape") {
        closeSearch();
        return;
      }
      if (searchQuery.trim() && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && highlightedIndex >= 0) {
          const target = searchResults[highlightedIndex];
          if (target) {
            e.preventDefault();
            openProduct(target);
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, searchQuery, searchResults, highlightedIndex]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      api
        .get("/products", { params: { search: searchQuery, limit: 5 } })
        .then((res) => {
          setSearchResults(res.data.products || []);
          setHighlightedIndex(-1);
        })
        .catch(() => {
          setSearchResults([]);
          setHighlightedIndex(-1);
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
      setRecentSearches(saveRecentSearch(searchQuery));
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      closeSearch();
    }
  };

  const jumpToCategory = (slug: string) => {
    closeSearch();
    navigate(`/shop?category=${slug}`);
  };

  const jumpToSearch = (term: string) => {
    setRecentSearches(saveRecentSearch(term));
    closeSearch();
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <motion.nav
        className={`topnav ${scrolled ? "scrolled" : ""}`}
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
            <Link to="/" prefetch="intent" className="topnav-logo" id="nav-logo">
              <span className="logo-box">
                FAN
              </span>
              <span className="logo-text-out">CLUB</span>
            </Link>
          </div>

          <div
            className="topnav-center desktop-only"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {[
              { name: "Shop", path: "/shop" },
              { name: "Fandom", path: "/fandom" },
              { name: "About", path: "/about" },
              { name: "Contact", path: "/contact" },
            ].map((item, index) => {
              const isActive = location.pathname === item.path;
              const isHovered = hoveredIndex === index;
              return (
                <Magnetic key={item.name} strength={0.2}>
                  <Link
                    to={item.path}
                    prefetch="intent"
                    className={`nav-link interactive ${isActive ? "active" : ""}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                  >
                    <span className="nav-link-text">{item.name}</span>
                    
                    {/* Smooth sliding hover background capsule */}
                    {isHovered && (
                      <motion.div
                        layoutId="nav-hover-capsule"
                        className="nav-hover-capsule"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}

                    {/* Smooth active underline/pill indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="nav-active-indicator"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </Magnetic>
              );
            })}
          </div>

          <div className="topnav-right">
            <Magnetic>
              <button
                className="btn-icon nav-icon-btn interactive"
                onClick={() => setSearchOpen(!searchOpen)}
                id="nav-search-btn"
                aria-label="Search products"
              >
                <Search size={22} />
              </button>
            </Magnetic>
            <div className="desktop-only-icons flex-align-center">
              <Magnetic>
                <Link
                  to="/wishlist"
                  prefetch="intent"
                  className="btn-icon nav-icon-btn interactive"
                  id="nav-wishlist-btn"
                >
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
                  <span className="cart-badge" style={{ visibility: count > 0 ? 'visible' : 'hidden' }}>{count}</span>
                </button>
              </Magnetic>
              {user ? (
                <div className="user-menu interactive">
                  <Magnetic>
                    <Link
                      to="/profile"
                      prefetch="intent"
                      className="btn-icon nav-icon-btn"
                      id="nav-profile-btn"
                    >
                      <User size={22} />
                    </Link>
                  </Magnetic>
                </div>
              ) : (
                <Magnetic>
                  <Link
                    to="/login"
                    prefetch="intent"
                    className="btn btn-sm btn-primary interactive"
                    id="nav-login-btn"
                  >
                    Sign In
                  </Link>
                </Magnetic>
              )}
            </div>
            <button
              className="topnav-menu-btn btn-icon"
              onClick={() => setMenuOpen(!menuOpen)}
              id="mobile-menu-btn"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search overlay — command palette (Ctrl/⌘ + K) */}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  autoFocus
                  className="search-input"
                  id="search-input"
                  aria-label="Search products"
                />
                <span className="search-esc-hint">
                  <kbd>ESC</kbd>
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={closeSearch}
                  aria-label="Close search"
                >
                  <X size={22} />
                </button>
              </form>

              {!searchQuery.trim() ? (
                /* Empty state: recent searches + quick filters */
                <div className="search-quick container">
                  {recentSearches.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-head">
                        <span className="search-group-label">
                          <History size={14} /> Recent Searches
                        </span>
                        <button
                          type="button"
                          className="search-clear-recent"
                          onClick={() => {
                            try {
                              localStorage.removeItem(RECENT_SEARCHES_KEY);
                            } catch {}
                            setRecentSearches([]);
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="search-chip-row">
                        {recentSearches.map((term) => (
                          <button
                            type="button"
                            key={term}
                            className="search-chip"
                            onClick={() => setSearchQuery(term)}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="search-group">
                    <span className="search-group-label">
                      <TrendingUp size={14} /> Quick Filters
                    </span>
                    <div className="search-chip-row">
                      {quickCategories.map((cat: any) => (
                        <button
                          type="button"
                          key={cat.id}
                          className="search-chip"
                          onClick={() => jumpToCategory(cat.slug)}
                        >
                          {cat.name}
                        </button>
                      ))}
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          type="button"
                          key={term}
                          className="search-chip search-chip-hot"
                          onClick={() => jumpToSearch(term)}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="search-results-dropdown container">
                  {isSearching ? (
                    <div className="search-loading">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="search-results-list">
                      {searchResults.map((product, idx) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          className={`search-result-item ${
                            highlightedIndex === idx ? "highlighted" : ""
                          }`}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => openProduct(product)}
                        >
                          <img
                            src={
                              product.images?.[0] ||
                              "https://via.placeholder.com/50"
                            }
                            alt={product.name}
                            className="search-result-img"
                          />
                          <div className="search-result-info">
                            <h4 className="search-result-name">
                              {product.name}
                            </h4>
                            <p className="search-result-price">
                              ₹{product.price}
                            </p>
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
                    <div className="search-no-results">
                      No results found for "{searchQuery}"
                    </div>
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
          <>
            <motion.div
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="mobile-menu open"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Drawer Header */}
              <div className="mobile-menu-header">
                <Link to="/" className="topnav-logo" onClick={() => setMenuOpen(false)}>
                  <span className="logo-box">FAN</span>
                  <span className="logo-text-out">CLUB</span>
                </Link>
                <button className="mobile-menu-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              {/* User greeting */}
              <div className="mobile-menu-user-section">
                {user ? (
                  <div className="mobile-menu-user-greeting">
                    <div className="mobile-menu-avatar">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="mobile-menu-welcome">Welcome back</p>
                      <p className="mobile-menu-username">{user.email?.split('@')[0]}</p>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="mobile-menu-signin-cta" onClick={() => setMenuOpen(false)}>
                    <div className="mobile-menu-avatar">
                      <LogIn size={16} />
                    </div>
                    <div>
                      <p className="mobile-menu-welcome">Join FANCLUB</p>
                      <p className="mobile-menu-username">Sign in / Register →</p>
                    </div>
                  </Link>
                )}
              </div>

              {/* Main nav links */}
              <div className="mobile-menu-section-label">Browse</div>
              <nav className="mobile-menu-links">
                {[
                  { to: '/shop', icon: Store, label: 'Shop Collection', badge: null },
                  { to: '/loyalty', icon: Flame, label: 'Loyalty Club', badge: '🔥' },
                  { to: '/fandom', icon: Zap, label: 'Fandom Drops', badge: 'NEW' },
                  { to: '/wishlist', icon: Heart, label: 'Wishlist', badge: null },
                ].map(({ to, icon: Icon, label, badge }) => (
                  <Link key={to} to={to} prefetch="intent" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <span className="mobile-menu-link-icon"><Icon size={18} /></span>
                    <span className="mobile-menu-link-label">{label}</span>
                    {badge && <span className="mobile-menu-link-badge">{badge}</span>}
                    <ChevronRight size={14} className="mobile-menu-link-arrow" />
                  </Link>
                ))}
              </nav>

              <div className="mobile-menu-section-label">Account</div>
              <nav className="mobile-menu-links">
                {[
                  { to: '/profile', icon: User, label: 'Account & Orders' },
                  { to: '/about', icon: BookOpen, label: 'About FANCLUB' },
                  { to: '/contact', icon: Phone, label: 'Help & Contact' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} prefetch="intent" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <span className="mobile-menu-link-icon"><Icon size={18} /></span>
                    <span className="mobile-menu-link-label">{label}</span>
                    <ChevronRight size={14} className="mobile-menu-link-arrow" />
                  </Link>
                ))}
                {user && (
                  <button
                    className="mobile-menu-link mobile-menu-logout"
                    onClick={() => { logout(); setMenuOpen(false); }}
                  >
                    <span className="mobile-menu-link-icon"><LogOut size={18} /></span>
                    <span className="mobile-menu-link-label">Sign Out</span>
                  </button>
                )}
              </nav>

              {/* Footer */}
              <div className="mobile-menu-footer">
                <span className="mobile-menu-footer-tag">FAN CLUB © 2026</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
