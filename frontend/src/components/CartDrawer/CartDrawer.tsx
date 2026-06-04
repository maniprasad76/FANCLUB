import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatImageUrl } from '../../lib/utils';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, total, updateQuantity, removeItem } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="cart-drawer-header">
              <h3>Your Cart ({items.length})</h3>
              <button className="btn-icon" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="cart-drawer-body">
              {items.length === 0 ? (
                <div className="cart-empty-state">
                  <ShoppingBag size={48} />
                  <p>Your cart is empty.</p>
                  <button className="btn btn-primary" onClick={onClose}>Continue Shopping</button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {items.map((item) => (
                    <div className="cart-drawer-item" key={item.id}>
                      <img 
                        src={formatImageUrl(item.product.images?.[0]) || 'https://placehold.co/100x120/f0f0f0/111?text=FAN'} 
                        alt={item.product.name} 
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <div className="cart-item-top">
                          <h4>{item.product.name}</h4>
                          <button className="btn-icon text-muted" onClick={() => removeItem(item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {item.size && <p className="cart-item-variant">Size: {item.size}</p>}
                        
                        <div className="cart-item-bottom">
                          <div className="qty-controls">
                            <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="cart-item-price">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-total">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <p className="cart-drawer-taxes">Taxes and shipping calculated at checkout.</p>
                <div className="cart-drawer-actions">
                  <Link to="/cart" className="btn btn-outline" onClick={onClose} style={{ flex: 1, textAlign: 'center' }}>
                    View Cart
                  </Link>
                  <Link to="/checkout" className="btn btn-primary" onClick={onClose} style={{ flex: 1, textAlign: 'center' }}>
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
