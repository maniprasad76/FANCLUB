import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, RefreshCw, ArrowLeft, Shield, CreditCard, Loader2 } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import './PaymentStatus.css';

/**
 * PaymentStatus page — provides real-time payment status tracking
 * with retry capability.
 *
 * URL patterns:
 *   /payment-status/:orderId                                ← Direct navigation
 */
export default function PaymentStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending' | 'cancelled'>('loading');
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/payment-status/' + orderId);
      return;
    }
    checkPaymentStatus();
  }, [orderId, user]);

  // Automatic polling for pending statuses (webhooks can take a few seconds)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if ((status === 'pending' || status === 'loading') && pollCount < 10) {
      interval = setInterval(() => {
        setPollCount(p => p + 1);
        checkPaymentStatus(true);
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [status, pollCount]);

  const checkPaymentStatus = async (isPolling = false) => {
    if (!isPolling) setStatus('loading');

    try {
      const urlStatus = searchParams.get('status');

      if (urlStatus === 'cancelled') {
        setStatus('cancelled');
        // Fetch order details anyway
        const { data: orderData } = await api.get(`/orders/${orderId}`);
        setOrder(orderData);
        return;
      }

      // Fetch order with payment details
      const { data: orderData } = await api.get(`/orders/${orderId}`);
      setOrder(orderData);

      // Get latest payment info
      if (orderData.payments?.length > 0) {
        setPayment(orderData.payments[0]);
      }

      // Determine final status from order
      if (orderData.status === 'CONFIRMED' || orderData.status === 'PROCESSING' || orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED') {
        setStatus('success');
      } else if (orderData.payments?.some((p: any) => p.status === 'FAILED')) {
        setStatus('failed');
      } else if (orderData.status === 'CANCELLED') {
        setStatus('cancelled');
      } else {
        setStatus('pending');
      }
    } catch (err: any) {
      toast.error('Failed to fetch payment status');
      setStatus('failed');
    }
  };

  /* ── Lazy-load Razorpay SDK (only when retry is initiated) ── */
  const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleRetry = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      const { data } = await api.post(`/payments/retry/${orderId}`);

      if (data.gateway === 'RAZORPAY' && data.razorpayOrderId) {
        // Lazy-load Razorpay SDK before opening modal
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway unavailable'); setRetrying(false); return; }
        // Open Razorpay modal
        const options: any = {
          key: data.razorpayKey,
          amount: data.amount * 100,
          currency: data.currency || 'INR',
          name: 'FANCLUB',
          description: 'Order Payment Retry',
          order_id: data.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await api.post('/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              toast.success('Payment successful!');
              checkPaymentStatus();
            } catch {
              toast.error('Payment verification failed');
            }
          },
          prefill: { email: user?.email, name: user?.name },
          theme: { color: '#D02020' },
          modal: { ondismiss: () => { setRetrying(false); } },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        toast.error('Unable to create payment retry');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry payment');
    }
    setRetrying(false);
  };

  const statusConfig: Record<string, { icon: any; title: string; desc: string; color: string; bg: string }> = {
    loading: {
      icon: <Loader2 size={48} className="spin" />,
      title: 'Verifying Payment...',
      desc: 'Please wait while we verify your payment status.',
      color: 'var(--bauhaus-blue)',
      bg: '#E3F2FD',
    },
    success: {
      icon: <CheckCircle2 size={48} />,
      title: 'Payment Successful!',
      desc: 'Your order has been confirmed and is being processed.',
      color: '#2E7D32',
      bg: '#E8F5E9',
    },
    failed: {
      icon: <XCircle size={48} />,
      title: 'Payment Failed',
      desc: 'Your payment could not be processed. You can retry or choose a different method.',
      color: 'var(--bauhaus-red)',
      bg: '#FFEBEE',
    },
    pending: {
      icon: <Clock size={48} />,
      title: 'Payment Pending',
      desc: 'Your payment is being processed. We\'ll update you once confirmed.',
      color: '#F0C020',
      bg: '#FFF8E1',
    },
    cancelled: {
      icon: <XCircle size={48} />,
      title: 'Payment Cancelled',
      desc: 'You cancelled the payment. You can retry anytime.',
      color: 'var(--text-muted)',
      bg: '#F5F5F5',
    },
  };

  const cfg = statusConfig[status];

  return (
    <AnimatedPage>
      <div className="payment-status-page container" id="payment-status-page">
        <motion.div
          className="payment-status-card glass-card"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Status icon */}
          <motion.div
            className="status-icon-wrapper"
            style={{ background: cfg.bg, color: cfg.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {cfg.icon}
          </motion.div>

          <motion.h1
            className="heading-lg status-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {cfg.title}
          </motion.h1>

          <motion.p
            className="status-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {cfg.desc}
          </motion.p>

          {/* Order details */}
          {order && (
            <motion.div
              className="status-order-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="detail-row">
                <span>Order Number</span>
                <strong className="font-mono">{order.orderNumber}</strong>
              </div>
              <div className="detail-row">
                <span>Amount</span>
                <strong className="font-mono price-display">₹{order.totalAmount?.toLocaleString('en-IN')}</strong>
              </div>
              {payment && (
                <>
                  <div className="detail-row">
                    <span>Payment Gateway</span>
                    <span className={`gateway-badge ${payment.gateway?.toLowerCase()}`}>
                      <CreditCard size={12} />
                      {payment.gateway}
                    </span>
                  </div>
                  {payment.method && (
                    <div className="detail-row">
                      <span>Payment Method</span>
                      <span className="font-mono" style={{ textTransform: 'uppercase' }}>{payment.method}</span>
                    </div>
                  )}
                </>
              )}
              <div className="detail-row">
                <span>Order Status</span>
                <span className={`badge badge-${order.status === 'CONFIRMED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'danger'}`}>
                  {order.status}
                </span>
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            className="status-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {(status === 'failed' || status === 'pending' || status === 'cancelled') && (
              <button
                className="btn btn-primary"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? <><Loader2 size={16} className="spin" /> Retrying...</> : <><RefreshCw size={16} /> Retry Payment</>}
              </button>
            )}

            {status === 'success' && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/profile')}
              >
                View My Orders
              </button>
            )}

            <button
              className="btn btn-outline"
              onClick={() => navigate('/shop')}
            >
              <ArrowLeft size={16} /> Continue Shopping
            </button>

            {status === 'pending' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => checkPaymentStatus()}
                style={{ marginTop: 8 }}
              >
                <RefreshCw size={14} /> Refresh Status
              </button>
            )}
          </motion.div>

          <p className="payment-status-secure">
            <Shield size={12} /> All payment data is encrypted and secure
          </p>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
