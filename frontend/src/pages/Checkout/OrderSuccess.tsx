import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Truck, Receipt, HeartHandshake, AlertTriangle, Clock } from 'lucide-react';
import { formatImageUrl } from '../../lib/utils';
import './OrderSuccess.css';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  /* If someone visits this page directly with no order data, redirect */
  useEffect(() => {
    if (!order) {
      const timer = setTimeout(() => navigate('/shop'), 3000);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [order]);

  if (!order) {
    return (
      <div className="order-success-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h2 className="heading-md">No order details found</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>Redirecting to shop...</p>
        </div>
      </div>
    );
  }

  const isPending = order.paymentPending;
  const isCOD = order.paymentMethod === 'COD';
  const orderItems = order.items || [];
  const address = order.address;

  return (
    <div className="order-success-page">
      <div className="container">

        <div className="success-header">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`success-icon-wrap ${isPending ? 'pending' : ''}`}
          >
            {isPending ? <AlertTriangle size={56} strokeWidth={2.5} /> : <HeartHandshake size={56} strokeWidth={2.5} />}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="success-title-wrap"
          >
            <div className={`success-badge ${isPending ? 'pending' : ''}`}>
              {isPending ? 'Payment Pending' : 'Transmission Complete'}
            </div>
            <h1 className="heading-xl success-title">
              {isPending ? 'Order ' : 'Thank '}<span className="text-gradient">{isPending ? 'Saved' : 'You'}</span>
            </h1>
            <p className="success-subtitle">
              {isPending
                ? 'Your order has been saved. Please complete payment to confirm.'
                : isCOD
                  ? 'Your order has been confirmed. Pay on delivery!'
                  : 'Payment successful! Your order is on its way.'}
            </p>
          </motion.div>
        </div>

        <div className="success-grid">
          {/* Left Column: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="success-card order-details-card"
          >
            <div className="card-header">
              <h2 className="heading-sm"><Receipt size={20}/> Order Summary</h2>
              <span className="order-id">{order.orderNumber || order.id?.slice(0, 8)}</span>
            </div>

            <div className="items-list">
              {orderItems.map((item: any, idx: number) => (
                <div key={idx} className="success-item">
                  <div className="item-img-wrapper">
                    <img src={formatImageUrl(item.image || item.product?.images?.[0])} alt={item.name || item.product?.name} loading="lazy" decoding="async" />
                  </div>
                  <div className="item-info">
                    <h4>{item.name || item.product?.name}</h4>
                    <p className="item-meta">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' • '}
                      {item.color && `Color: ${item.color}`}
                      {(item.size || item.color) && ' • '}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="item-price">
                    ₹{((item.price || item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{((order.totalAmount || 0) - (order.shippingAmount || 0)).toLocaleString('en-IN')}</span>
              </div>
              <div className="total-row">
                <span>Shipping & Taxes</span>
                <span>{(order.shippingAmount || 0) === 0 ? 'Free (Inclusive)' : `₹${order.shippingAmount}`}</span>
              </div>
              <div className="total-row">
                <span>Payment</span>
                <span>{isCOD ? 'Cash on Delivery' : `Online (${order.onlineMethod || 'UPI'})`}</span>
              </div>
              <div className="total-row grand-total">
                <span className="heading-sm">Total {isCOD ? 'Due' : 'Paid'}</span>
                <span className="heading-sm text-gradient">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Tracking & Actions */}
          <div className="success-sidebar">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="success-card shipping-card"
            >
              <div className="card-header">
                <h2 className="heading-sm"><Truck size={20}/> Dispatch Intel</h2>
              </div>
              <div className="dispatch-info">
                {address ? (
                  <>
                    <div className="info-block">
                      <span className="info-label">Destination</span>
                      <p><strong>{address.name}</strong> — {address.phone}</p>
                      <p>{address.street}, {address.city}, {address.state} {address.pincode}</p>
                    </div>
                  </>
                ) : (
                  <div className="info-block">
                    <span className="info-label">Destination</span>
                    <p>Shipping details attached to your order</p>
                  </div>
                )}
                <div className="info-block">
                  <span className="info-label">Estimated Arrival</span>
                  <p className="arrival-date">3-5 Business Days</p>
                </div>
                {isPending && (
                  <div className="info-block">
                    <span className="info-label" style={{ color: '#f59e0b' }}>Status</span>
                    <p style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={16} /> Payment pending — will ship after confirmation
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="success-actions"
            >
              <Link to="/shop" className="btn btn-primary btn-lg action-btn">
                <span>Continue Shopping</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/profile" className="btn btn-outline btn-lg action-btn">
                <Package size={20} />
                <span>Track Order</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative Bauhaus Elements */}
      <div className="bauhaus-decors">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="decor-circle"
        ></motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="decor-square"
        ></motion.div>
        <div className="decor-lines"></div>
        <motion.div
           initial={{ y: 0 }}
           animate={{ y: [0, -20, 0] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="decor-triangle"
        ></motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
