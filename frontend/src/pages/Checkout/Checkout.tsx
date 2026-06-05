import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, CreditCard, Truck, ChevronDown, Building2, Smartphone, CheckCircle2, Shield, Loader2, Globe } from 'lucide-react';
import AnimatedPage, { cinematicItem, cinematicStagger } from '../../components/AnimatedPage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import './Checkout.css';

declare global {
  interface Window { Razorpay: any; }
}

/* ── Payment brand icons as small SVGs ── */
const GPayIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <circle cx="12" cy="12" r="11" fill="#5F259F"/>
    <path d="M14.8 7.5H10.4c-.55 0-1 .45-1 1v6.5c0 .28.22.5.5.5s.5-.22.5-.5V12.5h3.2l2 2.8c.12.17.31.27.52.27.11 0 .22-.03.32-.1.27-.19.33-.56.14-.83L14.8 12.5c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zm1 3c0 .55-.45 1-1 1h-4.4V8.5h4.4c.55 0 1 .45 1 1v1z" fill="#fff"/>
  </svg>
);

const PaytmIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <rect x="1" y="1" width="22" height="22" rx="4" fill="#00B9F1"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif">Pay</text>
  </svg>
);

const UPIIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <rect x="1" y="1" width="22" height="22" rx="4" fill="#097939"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="900" fontFamily="Arial,sans-serif">UPI</text>
  </svg>
);

const NetBankingIcon = () => (
  <Building2 size={20} />
);



const CardIcon = () => (
  <CreditCard size={20} />
);

const RAZORPAY_METHODS = [
  { id: 'gpay',       label: 'Google Pay',  desc: 'Pay via Google Pay UPI',    rzMethod: 'upi',        gradient: 'linear-gradient(135deg,#4285F4,#34A853)', Icon: GPayIcon },
  { id: 'phonepe',    label: 'PhonePe',     desc: 'Pay via PhonePe UPI',       rzMethod: 'upi',        gradient: 'linear-gradient(135deg,#5F259F,#7B3FBF)', Icon: PhonePeIcon },
  { id: 'paytm',      label: 'Paytm',       desc: 'Pay via Paytm UPI/Wallet',  rzMethod: 'upi',        gradient: 'linear-gradient(135deg,#00B9F1,#0088CC)', Icon: PaytmIcon },
  { id: 'upi',        label: 'UPI ID',      desc: 'Enter any UPI address',     rzMethod: 'upi',        gradient: 'linear-gradient(135deg,#097939,#0FAF5F)', Icon: UPIIcon },
  { id: 'card',       label: 'Debit/Credit', desc: 'Visa, Mastercard, RuPay',  rzMethod: 'card',       gradient: 'linear-gradient(135deg,#1a1a2e,#334155)', Icon: CardIcon },
  { id: 'netbanking', label: 'Net Banking',  desc: 'All major banks supported', rzMethod: 'netbanking', gradient: 'linear-gradient(135deg,#1a1a2e,#334155)', Icon: NetBankingIcon },
];

export default function Checkout() {
  const { items, total, fetchCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [onlineSubMethod, setOnlineSubMethod] = useState('gpay');
  const [loading, setLoading] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '', country: 'India' });
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [customerCountry, setCustomerCountry] = useState('India');

  /* redirect guests to login (with return path), empty-cart users to cart */
  useEffect(() => {
    if (!user) { navigate('/login?redirect=/checkout'); return; }
    // BUGFIX: Only redirect to /cart after the cart has finished loading.
    // Without this guard, the check fires while fetchCart() is still in flight
    // and bounces authenticated users who have items.
    if (!cartLoading && items.length === 0) { navigate('/cart'); return; }

    // Merge any guest cart items into the server cart after login
    const guestCart = (() => {
      try { return JSON.parse(localStorage.getItem('fan_guest_cart') || '[]'); }
      catch { return []; }
    })();

    if (guestCart.length > 0) {
      // Merge each guest cart item into server cart, then clear guest cart
      Promise.all(
        guestCart.map((item: any) =>
          api.post('/cart', {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          }).catch(() => {}) // Ignore individual merge failures (e.g. inactive product)
        )
      ).then(() => {
        localStorage.removeItem('fan_guest_cart');
        fetchCart();
      });
    }

    api.get('/users/me/profile').then(r => {
      const addrs = r.data.addresses || [];
      setAddresses(addrs);
      const def = addrs.find((a: any) => a.isDefault);
      if (def) {
        setSelectedAddress(def.id);
        updateGatewayFromCountry(def.country || 'India');
      }
    }).catch((err: any) => {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login?redirect=/checkout');
      }
    });
  }, [user, cartLoading, items.length]);

  /* Auto-route gateway when address changes */
  const updateGatewayFromCountry = (country: string) => {
    setCustomerCountry(country);
  };

  const handleAddressSelect = (addr: any) => {
    setSelectedAddress(addr.id);
    updateGatewayFromCountry(addr.country || 'India');
  };

  /* ── Smart Location ── */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.address) {
          const addr = data.address;
          setNewAddr(prev => ({
            ...prev,
            street: data.display_name?.split(',').slice(0, 2).join(', ') || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
            country: addr.country === 'India' ? 'India' : (addr.country || 'India')
          }));
          setShowNewAddr(true);
          toast.success('Location updated successfully!');
        } else {
          toast.error('Could not determine location details.');
        }
      } catch {
        toast.error('Failed to fetch location details.');
      } finally {
        setFetchingLocation(false);
      }
    }, () => {
      setFetchingLocation(false);
      toast.error('Location access denied or failed.');
    });
  };

  /* ── Save new address to profile ── */
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const { data } = await api.post('/users/me/addresses', { ...newAddr, isDefault: true });
      setAddresses(prev => [...prev, data]);
      setSelectedAddress(data.id);
      updateGatewayFromCountry(data.country || 'India');
      setShowNewAddr(false);
      setNewAddr({ name: '', phone: '', street: '', city: '', state: '', pincode: '', country: 'India' });
      toast.success('Address saved to your profile!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
    setSavingAddr(false);
  };

  /* ── Open Razorpay modal ── */
  const openRazorpayModal = (razorpayOrderId: string, amount: number, key: string): Promise<{ razorpayPaymentId: string; razorpayOrderId: string; signature: string }> => {
    const sub = RAZORPAY_METHODS.find(m => m.id === onlineSubMethod);
    return new Promise((resolve, reject) => {
      const options: any = {
        key,
        amount: amount * 100,
        currency: 'INR',
        name: 'FANCLUB',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: (response: any) => {
          resolve({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
        },
        prefill: { email: user?.email, name: user?.name, method: sub?.rzMethod || 'upi' },
        theme: { color: '#D02020' },
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error('Please select a delivery address');
    if (items.length === 0) return toast.error('Your cart is empty');
    setLoading(true);
    try {
      const orderData: any = {
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity, size: item.size, color: item.color })),
        addressId: selectedAddress,
        paymentMethod,
        gateway: paymentMethod === 'ONLINE' ? 'RAZORPAY' : undefined,
        country: customerCountry,
      };
      const { data } = await api.post('/orders', orderData);

      if (paymentMethod === 'ONLINE') {
        const paymentGateway = data.gateway || 'RAZORPAY';

        if (paymentGateway === 'RAZORPAY' && data.razorpayOrderId) {
          try {
            const paymentResult = await openRazorpayModal(data.razorpayOrderId, data.totalAmount, data.razorpayKey);
            await api.post('/payments/verify', paymentResult);
            await fetchCart();
            navigate('/order-success', { state: { order: { ...data, paymentMethod: 'ONLINE', onlineMethod: onlineSubMethod, gateway: 'RAZORPAY' } } });
          } catch {
            toast.error('Payment cancelled or failed. Order saved as pending.');
            await fetchCart();
            navigate('/payment-status/' + data.id + '?status=cancelled');
          }
        } else {
          // Fallback — show payment status page
          await fetchCart();
          navigate('/payment-status/' + data.id);
        }
      } else {
        await fetchCart();
        navigate('/order-success', { state: { order: { ...data, paymentMethod: 'COD' } } });
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login?redirect=/checkout');
      } else {
        toast.error(err.response?.data?.message || 'Order failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const shipping = total >= 999 ? 0 : 99;

  return (
    <AnimatedPage>
      <div className="checkout-page container" id="checkout-page">
        <motion.div className="checkout-header" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <h1 className="heading-lg">Checkout</h1>
          <div className="checkout-secure-badge"><Shield size={14} /> Secure Checkout</div>
        </motion.div>

        <motion.div className="checkout-layout" variants={cinematicStagger} initial="initial" animate="animate">
          <motion.div className="checkout-left" variants={cinematicItem}>

            {/* ─── ADDRESS SECTION ─── */}
            <section className="checkout-section glass-card cinematic-panel" id="checkout-address">
              <h3 className="heading-sm"><MapPin size={18} /> Shipping Address</h3>
              <div className="address-list">
                {addresses.map((addr, i) => (
                  <motion.label
                    key={addr.id}
                    className={`address-option ${selectedAddress === addr.id ? 'active' : ''}`}
                    aria-label={`Select address: ${addr.name}, ${addr.street}, ${addr.city}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.07, 0.35) }}
                  >
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => handleAddressSelect(addr)} />
                    <div className="address-content">
                      <div className="address-name-row">
                        <strong>{addr.name}</strong>
                        {addr.isDefault && <span className="default-badge">Default</span>}
                        {addr.country && addr.country !== 'India' && (
                          <span className="international-badge"><Globe size={10} /> {addr.country}</span>
                        )}
                      </div>
                      <span className="address-phone">{addr.phone}</span>
                      <p className="address-text">{addr.street}, {addr.city}, {addr.state} {addr.pincode}</p>
                    </div>
                    {selectedAddress === addr.id && <CheckCircle2 size={20} className="address-check" />}
                  </motion.label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', marginBottom: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowNewAddr(!showNewAddr)} aria-expanded={showNewAddr}>
                  {showNewAddr ? 'Cancel' : '+ Add New Address'}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleUseCurrentLocation} disabled={fetchingLocation} style={{ display: 'flex', alignItems: 'center' }}>
                  {fetchingLocation ? <><Loader2 size={14} className="spin" style={{marginRight: '6px'}} /> Locating...</> : <><MapPin size={14} style={{marginRight: '6px'}} /> Use Current Location</>}
                </button>
              </div>
              <AnimatePresence>
                {showNewAddr && (
                  <motion.form onSubmit={handleAddAddress} className="new-addr-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                    <input className="input-field" placeholder="Full Name" value={newAddr.name} onChange={e => setNewAddr({...newAddr, name: e.target.value})} required />
                    <input className="input-field" placeholder="Phone Number" value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} required />
                    <input className="input-field" placeholder="Street Address" value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} required />
                    <div className="addr-row">
                      <input className="input-field" placeholder="City" value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} required />
                      <input className="input-field" placeholder="State" value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} required />
                      <input className="input-field" placeholder="Pincode" value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} required />
                    </div>
                    <select
                      className="input-field"
                      value={newAddr.country}
                      onChange={e => setNewAddr({...newAddr, country: e.target.value})}
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="UAE">UAE</option>
                      <option value="Other">Other</option>
                    </select>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingAddr} aria-busy={savingAddr}>
                      {savingAddr ? <><Loader2 size={14} className="spin" /> Saving...</> : 'Save Address to Profile'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </section>

            {/* ─── PAYMENT SECTION ─── */}
            <section className="checkout-section glass-card cinematic-panel" id="checkout-payment">
              <h3 className="heading-sm"><CreditCard size={18} /> Payment Method</h3>

              {/* COD */}
              <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <div className="payment-icon cod-icon"><Truck size={20} /></div>
                <div className="payment-info">
                  <span className="payment-label">Cash on Delivery</span>
                  <span className="payment-desc">Pay when you receive your order</span>
                </div>
              </label>

              {/* Online */}
              <label className={`payment-option ${paymentMethod === 'ONLINE' ? 'active' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                <div className="payment-icon online-icon"><Smartphone size={20} /></div>
                <div className="payment-info">
                  <span className="payment-label">Online Payment</span>
                  <span className="payment-desc">UPI, Cards, Net Banking & more</span>
                </div>
                <ChevronDown size={18} className={`payment-chevron ${paymentMethod === 'ONLINE' ? 'open' : ''}`} />
              </label>

              {/* Online sub-options — Gateway selector + methods */}
              <AnimatePresence>
                {paymentMethod === 'ONLINE' && (
                  <motion.div className="online-payment-expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>

                    {/* Razorpay sub-methods */}
                    <motion.div className="online-methods-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      {RAZORPAY_METHODS.map(({ id, label, desc, gradient, Icon }) => (
                        <motion.label
                          key={id}
                          className={`online-method-card ${onlineSubMethod === id ? 'active' : ''}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <input type="radio" name="onlineMethod" checked={onlineSubMethod === id} onChange={() => setOnlineSubMethod(id)} />
                          <div className="method-icon" style={{ background: gradient }}><Icon /></div>
                          <div className="method-info">
                            <span className="method-label">{label}</span>
                            <span className="method-desc">{desc}</span>
                          </div>
                          {onlineSubMethod === id && <CheckCircle2 size={16} className="method-check" />}
                        </motion.label>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </motion.div>

          {/* ─── ORDER SUMMARY ─── */}
          <motion.div className="checkout-summary glass-card cinematic-panel" variants={cinematicItem} id="checkout-summary">
            <h3 className="heading-sm">Order Summary</h3>
            <div className="checkout-items">
              {items.map((item, index) => (
                <motion.div key={item.id} className="checkout-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.06, 0.32) }}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                </motion.div>
              ))}
            </div>
            <div className="summary-row"><span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{(total + shipping).toLocaleString('en-IN')}</span></div>

            <div className="selected-payment-preview">
              {paymentMethod === 'COD'
                ? <span><Truck size={14} /> Cash on Delivery</span>
                : <span><Smartphone size={14} /> {RAZORPAY_METHODS.find(m => m.id === onlineSubMethod)?.label || 'Razorpay'}</span>}
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handlePlaceOrder} disabled={loading} id="place-order-btn" aria-busy={loading}>
              {loading
                ? <><Loader2 size={18} className="spin" /> Processing...</>
                : paymentMethod === 'ONLINE'
                  ? `Pay ₹${(total + shipping).toLocaleString('en-IN')}`
                  : 'Place Order'}
            </button>

            <p className="checkout-secure-note"><Shield size={12} /> Your data is encrypted and secure</p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
