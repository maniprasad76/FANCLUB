import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import ProductCard from '../../components/ProductCard/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.get('/wishlist').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}><div className="skeleton" style={{ height: 300 }} /></div>;

  if (!user) {
    return (
      <AnimatedPage>
        <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 32px)', minHeight: '100vh', textAlign: 'center' }} id="wishlist-page">
          <h1 className="heading-lg">My <span className="text-gradient">Wishlist</span></h1>
          <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Heart size={64} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 className="heading-md" style={{ marginTop: 24, marginBottom: 16 }}>Please log in to view your wishlist</h3>
            <Link to="/login?redirect=/wishlist" className="btn btn-primary">Log In</Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 32px)', minHeight: '100vh' }} id="wishlist-page">
        <h1 className="heading-lg">My <span className="text-gradient">Wishlist</span></h1>
        <p className="text-muted">{items.length} items</p>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={64} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 className="heading-md">Your wishlist is empty</h3>
            <p className="text-muted">Start adding items you love!</p>
          </div>
        ) : (
          <div className="product-grid" style={{ marginTop: 32 }}>
            {items.map((item: any) => <ProductCard key={item.id} product={item.product} />)}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
