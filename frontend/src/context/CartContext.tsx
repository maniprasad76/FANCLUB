import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  product: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  addToCart: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const GUEST_CART_KEY = 'tfi_guest_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ─── Helper: read/write guest cart from localStorage ─── */
function getGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function calcTotal(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
}

function calcCount(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ─── Recalculate totals whenever items change ─── */
  useEffect(() => {
    setTotal(calcTotal(items));
    setCount(calcCount(items));
  }, [items]);

  /* ─── Fetch cart: server for logged-in, localStorage for guest ─── */
  const fetchCart = async () => {
    if (user) {
      setLoading(true);
      try {
        const { data } = await api.get('/cart');
        setItems(data.items || []);
      } catch (err: any) {
        // On 401 (expired session), fall back to guest cart instead of empty
        if (err.response?.status === 401) {
          setItems(getGuestCart());
        }
        // Other errors: silently fail, keep current items
      }
      setLoading(false);
    } else {
      setItems(getGuestCart());
    }
  };

  /* ─── On user change: load appropriate cart ─── 
     Wait for auth to finish verifying before fetching server cart.
     This prevents firing a request with an expired JWT cookie. */
  useEffect(() => {
    if (authLoading) return;
    fetchCart();
  }, [user, authLoading]);

  /* ─── ADD TO CART ─── */
  const addToCart = async (productId: string, quantity: number, size?: string, color?: string) => {
    if (user) {
      // Server cart for logged-in users
      setCount(prev => prev + quantity);
      try {
        await api.post('/cart', { productId, quantity, size, color });
        toast.success('Added to cart!');
        await fetchCart();
      } catch {
        setCount(prev => prev - quantity);
        toast.error('Failed to add to cart');
      }
    } else {
      // Guest cart via localStorage
      try {
        // Fetch product details from API
        const { data: product } = await api.get(`/products/${productId}`);
        const guestItems = getGuestCart();
        const existingIndex = guestItems.findIndex(
          item => item.productId === productId && item.size === size && item.color === color
        );

        if (existingIndex >= 0) {
          guestItems[existingIndex].quantity += quantity;
        } else {
          guestItems.push({
            id: `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            productId,
            quantity,
            size,
            color,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              comparePrice: product.comparePrice,
              images: product.images || [],
              stock: product.stock,
            },
          });
        }

        saveGuestCart(guestItems);
        setItems([...guestItems]);
        toast.success('Added to cart!');
      } catch {
        toast.error('Failed to add to cart');
      }
    }
  };

  /* ─── UPDATE QUANTITY ─── */
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (user) {
      const originalItems = [...items];
      const updatedItems = items.map(item => item.id === itemId ? { ...item, quantity } : item);
      setItems(updatedItems);

      try {
        await api.put(`/cart/${itemId}`, { quantity });
        await fetchCart();
      } catch {
        setItems(originalItems);
        fetchCart();
        toast.error('Failed to update quantity');
      }
    } else {
      const guestItems = getGuestCart();
      const updated = guestItems.map(item => item.id === itemId ? { ...item, quantity } : item);
      saveGuestCart(updated);
      setItems([...updated]);
    }
  };

  /* ─── REMOVE ITEM ─── */
  const removeItem = async (itemId: string) => {
    if (user) {
      const originalItems = [...items];
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);

      try {
        await api.delete(`/cart/${itemId}`);
        toast.success('Item removed');
        await fetchCart();
      } catch {
        setItems(originalItems);
        fetchCart();
        toast.error('Failed to remove item');
      }
    } else {
      const guestItems = getGuestCart();
      const updated = guestItems.filter(item => item.id !== itemId);
      saveGuestCart(updated);
      setItems([...updated]);
      toast.success('Item removed');
    }
  };

  /* ─── CLEAR CART ─── */
  const clearCart = async () => {
    if (user) {
      const originalItems = [...items];
      setItems([]);

      try {
        await api.delete('/cart');
        toast.success('Cart cleared');
      } catch {
        setItems(originalItems);
        fetchCart();
        toast.error('Failed to clear cart');
      }
    } else {
      saveGuestCart([]);
      setItems([]);
      toast.success('Cart cleared');
    }
  };

  return (
    <CartContext.Provider value={{ items, total, count, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
