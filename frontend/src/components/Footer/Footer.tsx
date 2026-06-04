import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, Check } from 'lucide-react';
import { SOCIAL_LINKS } from '../../config';
import api from '../../lib/api';
import './Footer.css';

const IconInstagram = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="24" height="24"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
);
const IconWhatsapp = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" width="24" height="24"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.6c-33.2 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.4-186.6 184.4zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-2.1-3.6 2.1-3.2 7.6-14.1 1.8-3.6.9-6.7-.5-9.5-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 320 512" fill="currentColor" width="24" height="24"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 576 512" fill="currentColor" width="24" height="24"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.781 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" width="24" height="24"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
);
const IconPinterest = () => (
  <svg viewBox="0 0 496 512" fill="currentColor" width="24" height="24"><path d="M248 8C111.1 8 0 119.1 0 256c0 105.1 65 194.2 157.9 235.3-2.1-19.5-3.9-49.4.8-70.6 4.3-19.3 27.9-118.5 27.9-118.5s-7.1-14.3-7.1-35.4c0-33.2 19.3-58 43.3-58 20.3 0 30.2 15.3 30.2 33.6 0 20.5-13 51.1-19.8 79.5-5.6 23.7 11.9 43 35.3 43 42.4 0 75-44.7 75-109.1 0-57-41-96.9-99.5-96.9-67 0-106.3 50.3-106.3 102.1 0 20.1 7.7 41.7 17.4 53.4 1.9 2.3 2.2 4.3 1.6 6.7-1.9 7.9-6.2 25.3-7 28.5-1 4.1-3.4 5-7.5 3.1-28.1-13.1-45.7-54.3-45.7-87.3 0-70.8 51.5-135.7 148-135.7 78 0 138.6 55.6 138.6 129.7 0 77.6-48.9 140-116.7 140-22.8 0-44.2-11.8-51.6-25.8l-14 53.3c-5 19.1-18.6 42.9-27.7 57.5 21.6 6.6 44.5 10.2 68.3 10.2 136.9 0 248-111.1 248-248S384.9 8 248 8z"/></svg>
);

export default function Footer() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const toggleDropdown = (section: string) => {
    setOpenDropdown(openDropdown === section ? null : section);
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
      <div className="bauhaus-color-bar">
        <div />
        <div />
      </div>
      <div className="container footer-container">
        
        {/* Newsletter Drop System */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h3>Join The Drop</h3>
            <p>Get early access to limited releases, underground collections, and exclusive FAN content before they sell out.</p>
          </div>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <input 
              type="email" 
              placeholder="YOUR EMAIL" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-btn">
              {subscribed ? <Check size={24} /> : <ArrowRight size={24} />}
            </button>
            {subscribed && <span className="newsletter-success">You're on the list.</span>}
          </form>
        </div>

        <div className="footer-main-grid">
          
          {/* Brand & Socials Column */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-logo">
              <span className="logo-box">FAN</span>
              <div className="logo-text">
                <span className="text-red">TELUGU</span>
                <span className="text-yellow">FILM</span>
                <span className="text-blue">INDUSTRY</span>
              </div>
            </Link>
            <p className="footer-brand-desc">
              Premium streetwear inspired by the legacy of Telugu Cinema. 
              We blend cinematic storytelling with modern design for the true fans.
            </p>
            <div className="footer-socials">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram /></a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><IconWhatsapp /></a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><IconYoutube /></a>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"><IconTwitter /></a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links-group">
              <button className="footer-dropdown-btn" onClick={() => toggleDropdown('shop')}>
                <span className="footer-links-title">Shop</span>
                <ChevronDown size={18} className={`dropdown-icon ${openDropdown === 'shop' ? 'open' : ''}`} />
              </button>
              <div className={`footer-dropdown-content ${openDropdown === 'shop' ? 'show' : ''}`}>
                <div className="footer-dropdown-inner">
                  <Link to="/shop">All Products</Link>
                  <Link to="/shop?gender=MEN">Men's Collection</Link>
                  <Link to="/shop?gender=WOMEN">Women's Collection</Link>
                  <Link to="/shop?category=jeans">Denim</Link>
                  <Link to="/shop?category=shirts">Shirts</Link>
                  <Link to="/shop?category=hoodies">Hoodies & Sweats</Link>
                </div>
              </div>
            </div>

            <div className="footer-links-group">
              <button className="footer-dropdown-btn" onClick={() => toggleDropdown('support')}>
                <span className="footer-links-title">Support</span>
                <ChevronDown size={18} className={`dropdown-icon ${openDropdown === 'support' ? 'open' : ''}`} />
              </button>
              <div className={`footer-dropdown-content ${openDropdown === 'support' ? 'show' : ''}`}>
                <div className="footer-dropdown-inner">
                  <Link to="/contact">Help Center</Link>
                  <Link to="/faq">FAQs</Link>
                  <Link to="/returns">Returns & Exchanges</Link>
                  <Link to="/shipping">Shipping Information</Link>
                  <Link to="/track-order">Track Order</Link>
                </div>
              </div>
            </div>

            <div className="footer-links-group">
              <button className="footer-dropdown-btn" onClick={() => toggleDropdown('company')}>
                <span className="footer-links-title">Company</span>
                <ChevronDown size={18} className={`dropdown-icon ${openDropdown === 'company' ? 'open' : ''}`} />
              </button>
              <div className={`footer-dropdown-content ${openDropdown === 'company' ? 'show' : ''}`}>
                <div className="footer-dropdown-inner">
                  <Link to="/about">Our Story</Link>
                  <Link to="/cinema">The Lounge</Link>
                  <Link to="/contact">Contact Us</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                  <Link to="/terms">Terms of Service</Link>
                </div>
              </div>
            </div>
            
            <div className="footer-links-group">
              <button className="footer-dropdown-btn" onClick={() => toggleDropdown('contact')}>
                <span className="footer-links-title">Contact</span>
                <ChevronDown size={18} className={`dropdown-icon ${openDropdown === 'contact' ? 'open' : ''}`} />
              </button>
              <div className={`footer-dropdown-content ${openDropdown === 'contact' ? 'show' : ''}`}>
                <div className="footer-dropdown-inner contact-info">
                  <p><strong>Email:</strong><br/><a href="mailto:support@fanclub.com">support@fanclub.com</a></p>
                  <p><strong>Phone:</strong><br/><a href="tel:7569428709">+91 75694 28709</a></p>
                  <p><strong>Hours:</strong><br/>Mon-Sat, 9AM - 8PM IST</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">© {new Date().getFullYear()} FANCLUB. All rights reserved.</p>
          <div className="footer-badges">
            <span className="payment-badge">Secure Payments</span>
            <span className="shipping-badge">Worldwide Shipping</span>
          </div>
          <p className="footer-founder">
            Crafted by{' '}
            <a 
              href="https://instagram.com/___mani___76" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="founder-link"
            >
              @___mani___76
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

