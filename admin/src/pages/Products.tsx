import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import api from '../lib/api';

let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
if (baseUrl.includes('localhost') && typeof window !== 'undefined') {
  baseUrl = baseUrl.replace('localhost', window.location.hostname);
}

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchProducts = () => {
    api.get('/products/admin/all', { params: { page, limit: 20, search: search || undefined } })
      .then(r => { setProducts(r.data.products); setTotal(r.data.total); })
      .catch(() => {});
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} selected products?`)) return;
    await api.post('/products/bulk-delete', { ids: selectedIds });
    setSelectedIds([]);
    fetchProducts();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) setSelectedIds([]);
    else setSelectedIds(products.map(p => p.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div id="admin-products">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Package size={24} style={{ color: 'var(--bauhaus-blue)' }} />
            <h1 className="page-title">Products</h1>
          </div>
          <p className="page-subtitle">{total} total products</p>
        </div>
        <Link to="/products/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', maxWidth: 360, flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 40 }} />
        </div>
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedIds.length} selected</span>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <Trash2 size={16} /> Delete Selected
            </button>
          </div>
        )}
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" checked={products.length > 0 && selectedIds.length === products.length} onChange={toggleSelectAll} style={{ accentColor: 'var(--bauhaus-red)', width: 16, height: 16 }} />
            </th>
            <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ accentColor: 'var(--bauhaus-red)', width: 16, height: 16 }} />
                </td>
                <td>
                  <img src={p.images?.[0] ? (p.images[0].startsWith('/') ? baseUrl + p.images[0] : p.images[0]) : 'https://placehold.co/48x48/F0F0F0/121212?text=FAN'} alt="" style={{ width: 48, height: 48, objectFit: 'cover', border: '2px solid var(--bauhaus-black)' }} />
                </td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{p.category?.name || '—'}</td>
                <td style={{ fontWeight: 700 }}>₹{p.price.toLocaleString('en-IN')}</td>
                <td>
                  <span className={p.stock > 0 ? 'badge badge-success' : 'badge badge-danger'}>
                    {p.stock > 0 ? p.stock : 'OUT'}
                  </span>
                </td>
                <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/products/${p.id}/edit`} className="btn btn-secondary btn-sm"><Edit size={14} /></Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
