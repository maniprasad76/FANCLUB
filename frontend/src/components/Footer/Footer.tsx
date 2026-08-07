import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, Check } from 'lucide-react';
import api, { SOCIAL_LINKS } from '../../lib/api';
import './Footer.css';

const IconInstagram = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="18" height="18"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
);
const IconWhatsapp = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="18" height="18"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.6c-33.2 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.4-186.6 184.4zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-2.1-3.6 2.1-3.2 7.6-14.1 1.8-3.6.9-6.7-.5-9.5-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 576 512" fill="currentColor" width="18" height="18"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" width="18" height="18"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="18" height="18"><path d="M400 32H48A16 16 0 0 0 32 48v416a16 16 0 0 0 16 16h214.6V300.6h-59.5v-69h59.5v-51.4c0-58.9 36-91 88.6-91 25.2 0 46.9 1.9 53.2 2.7v61.7h-36.5c-28.6 0-34.1 13.6-34.1 33.5v44.5h68.3l-8.9 69h-59.4V480H400a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"/></svg>
);

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/newsletter', { email });
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-container">
        
        {/* Top Newsletter Bar */}
        <div className="footer-newsletter-bar">
          <div className="newsletter-info">
            <h3>Stay in the Loop</h3>
            <p>Subscribe for exclusive drops, early access, and special offers.</p>
          </div>
          <form onSubmit={handleSubscribe} className="newsletter-form-clean">
            <div className="newsletter-field-group">
              <input 
                type="email" 
                placeholder="Your email address..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className={`newsletter-submit-btn ${subscribed ? 'submitted' : ''}`} 
                aria-label="Subscribe"
              >
                {subscribed ? (
                  <>Joined <Check size={14} /></>
                ) : (
                  <>Subscribe <ArrowRight size={14} /></>
                )}
              </button>
            </div>
            {subscribed && <span className="newsletter-msg">✓ Subscribed successfully</span>}
          </form>
        </div>

        {/* Main Footer Clean Grid */}
        <div className="footer-grid-clean">
          
          {/* Brand Info */}
          <div className="brand-info">
            <Link to="/" className="clean-footer-brand-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
              <span className="logo-box" style={{ margin: 0 }}>FAN</span>
              <span className="footer-tagline-inline" style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, letterSpacing: '2px', lineHeight: 1 }}>
                <span className="tagline-yellow">BE YOUR OWN</span> <span className="tagline-blue">STYLE</span>
              </span>
            </Link>
            <p className="brand-desc">
              Cinema, Anime, Cartoons & Inspirations brought to life through fashion. Streetwear inspired by screen culture.
            </p>
            <div className="social-links-clean">
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-btn-clean wa"><IconWhatsapp /></a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-btn-clean ig"><IconInstagram /></a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-btn-clean yt"><IconYoutube /></a>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-btn-clean tw"><IconTwitter /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-btn-clean fb"><IconFacebook /></a>
            </div>
          </div>

          {/* Column 1: Shop */}
          <div className="footer-col-group">
            <h4 className="footer-col-header">Shop</h4>
            <button className="mobile-acc-btn" onClick={() => toggleSection('shop')}>
              <span>Shop</span>
              <ChevronDown size={16} className={`acc-icon ${openSection === 'shop' ? 'open' : ''}`} />
            </button>
            <div className={`footer-acc-wrapper ${openSection === 'shop' ? 'open' : ''}`}>
              <div className="footer-acc-inner">
                <ul className="footer-nav-list">
                  <li><Link to="/shop">All Products</Link></li>
                  <li><Link to="/shop?gender=MEN">Men's Collection</Link></li>
                  <li><Link to="/shop?gender=WOMEN">Women's Collection</Link></li>
                  <li><Link to="/shop?category=jeans">Denim</Link></li>
                  <li><Link to="/shop?category=shirts">Shirts</Link></li>
                  <li><Link to="/shop?category=hoodies">Hoodies & Sweats</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 2: Support */}
          <div className="footer-col-group">
            <h4 className="footer-col-header">Support</h4>
            <button className="mobile-acc-btn" onClick={() => toggleSection('support')}>
              <span>Support</span>
              <ChevronDown size={16} className={`acc-icon ${openSection === 'support' ? 'open' : ''}`} />
            </button>
            <div className={`footer-acc-wrapper ${openSection === 'support' ? 'open' : ''}`}>
              <div className="footer-acc-inner">
                <ul className="footer-nav-list">
                  <li><Link to="/contact">Help Center</Link></li>
                  <li><Link to="/faq">FAQs</Link></li>
                  <li><Link to="/returns">Returns & Exchanges</Link></li>
                  <li><Link to="/shipping">Shipping Info</Link></li>
                  <li><Link to="/track-order">Track Order</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col-group">
            <h4 className="footer-col-header">Company</h4>
            <button className="mobile-acc-btn" onClick={() => toggleSection('company')}>
              <span>Company</span>
              <ChevronDown size={16} className={`acc-icon ${openSection === 'company' ? 'open' : ''}`} />
            </button>
            <div className={`footer-acc-wrapper ${openSection === 'company' ? 'open' : ''}`}>
              <div className="footer-acc-inner">
                <ul className="footer-nav-list">
                  <li><Link to="/about">About Us</Link></li>
                  <li><Link to="/fandom">The Lounge</Link></li>
                  <li><Link to="/contact">Contact Us</Link></li>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/terms">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 4: Contact */}
          <div className="footer-col-group">
            <h4 className="footer-col-header">Contact</h4>
            <button className="mobile-acc-btn" onClick={() => toggleSection('contact')}>
              <span>Contact</span>
              <ChevronDown size={16} className={`acc-icon ${openSection === 'contact' ? 'open' : ''}`} />
            </button>
            <div className={`footer-acc-wrapper ${openSection === 'contact' ? 'open' : ''}`}>
              <div className="footer-acc-inner">
                <div className="contact-clean-list">
                  <div className="contact-item-clean">
                    <span className="item-label">Email</span>
                    <a href="mailto:support@fanclub.com" className="item-value">support@fanclub.com</a>
                  </div>
                  <div className="contact-item-clean">
                    <span className="item-label">Phone / WhatsApp</span>
                    <a href="tel:7569428709" className="item-value">+91 75694 28709</a>
                  </div>
                  <div className="online-badge">
                    <span className="pulse-dot"></span>
                    <span>Support Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-clean">
          <p className="bottom-copyright">© {new Date().getFullYear()} FANCLUB. All rights reserved.</p>
          <div className="bottom-badges-clean">
            <span className="badge-item">256-Bit SSL Encrypted</span>
            <span className="badge-item">Express Shipping</span>
            <span className="badge-item">100% Authentic Merch</span>
          </div>
          <p className="bottom-founder">
            Crafted by{' '}
            <a 
              href="https://instagram.com/___mani___76" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="founder-tag"
            >
              @___mani___76
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}
