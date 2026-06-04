import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, AlertTriangle, Clock } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import SEOHead from '../../components/SEOHead';
import { useCart } from '../../context/CartContext';
import { formatImageUrl } from '../../lib/utils';
import './Cart.css';

const FREE_SHIPPING_THRESHOLD = 999;

export default function Cart() {
  const { items, total, count, updateQuantity, removeItem } = useCart();

  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  if (count === 0) {
    return (
      <AnimatedPage>
        <SEOHead title="Cart | FANCLUB" description="Your shopping cart is empty. Browse our cinema-inspired streetwear collection." noIndex />
        <div className="cart-empty container" id="cart-page">
          <ShoppingBag size={64} strokeWidth={1} />
          <h2 className="heading-md">Your Cart is Empty</h2>
          <p className="text-muted">Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <SEOHead title={`Cart (${count} items) | FANCLUB`} description="Complete your purchase at FANCLUB." noIndex />
      <div className="cart-page container" id="cart-page">
        <h1 className="heading-lg">Shopping Cart</h1>

        {/* Loss Aversion: Urgency messaging */}
        <div className="cart-urgency-banner">
          <Clock size={14} />
          <span>Don't lose your items — complete your purchase before they sell out!</span>
        </div>

        <p className="text-muted">{count} items</p>
        <div className="cart-layout">
          <div className="cart-items">
            {/* Free Shipping Progress Bar (Loss Aversion) */}
            <div className="cart-shipping-progress">
              {shippingRemaining > 0 ? (
                <>
                  <div className="shipping-progress-text">
                    <Truck size={16} />
                    <span>Add <strong>₹{shippingRemaining.toLocaleString('en-IN')}</strong> more for <strong>FREE shipping!</strong></span>
                  </div>
                  <div className="shipping-progress-bar">
                    <div className="shipping-progress-fill" style={{ width: `${shippingProgress}%` }} />
                  </div>
                </>
              ) : (
                <div className="shipping-progress-text shipping-free">
                  <Truck size={16} />
                  <span>🎉 You've unlocked <strong>FREE shipping!</strong></span>
                </div>
              )}
            </div>

            {items.map((item) => (
              <div key={item.id} className="cart-item glass-card">
                <img src={formatImageUrl(item.product.images?.[0]) || 'https://placehold.co/120x150/1a1a2e/8b5cf6?text=FAN'} alt={item.product.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <Link to={`/product/${item.product.slug}`} className="cart-item-name">{item.product.name}</Link>
                  {item.size && <span className="cart-item-variant">Size: {item.size}</span>}
                  {item.color && <span className="cart-item-variant">Color: {item.color}</span>}
                  <div className="cart-item-price">₹{item.product.price.toLocaleString('en-IN')}</div>
                  {/* Loss Aversion: Per-item scarcity */}
                  {(item.product as any).stock && (item.product as any).stock < 20 && (
                    <div className="cart-item-scarcity">
                      <AlertTriangle size={12} /> Selling fast — only {(item.product as any).stock} left!
                    </div>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                  </div>
                  <div className="cart-item-total">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</div>
                  <button className="cart-remove" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}

            {/* Loss Aversion: Items not reserved warning */}
            <div className="cart-not-reserved">
              ⚠️ Items in your cart are not reserved and may sell out
            </div>
          </div>
          <div className="cart-summary glass-card">
            <h3 className="heading-sm">Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{total >= 999 ? 'Free' : '₹99'}</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{(total >= 999 ? total : total + 99).toLocaleString('en-IN')}</span></div>
            <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }} id="checkout-btn">
              Checkout <ArrowRight size={18} />
            </Link>
            <p className="cart-secure-note">🔒 Secure checkout — Your data is encrypted</p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
