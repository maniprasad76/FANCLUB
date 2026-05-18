import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import ImageUpload from '../components/ImageUpload';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: 0, comparePrice: 0,
    images: [''], sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White'],
    categoryId: '', stock: 0, featured: false, bestseller: false, newArrival: false, tags: [''],
    gender: 'UNISEX'
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      api.get(`/products/${id}`).then(r => {
        const p = r.data;
        setForm({ ...p, images: p.images?.length ? p.images : [''], tags: p.tags?.length ? p.tags : [''] });
      }).catch(() => {});
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = { ...form, images: form.images.filter(Boolean), tags: form.tags.filter(Boolean), sizes: form.sizes.filter(Boolean), colors: form.colors.filter(Boolean), price: Number(form.price), comparePrice: Number(form.comparePrice), stock: Number(form.stock) };
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, data);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', data);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const updateArrayField = (field: string, index: number, value: string) => {
    const arr = [...(form as any)[field]];
    arr[index] = value;
    setForm(prev => ({ ...prev, [field]: arr }));
  };
  const addArrayItem = (field: string) => setForm(prev => ({ ...prev, [field]: [...(prev as any)[field], ''] }));

  const labelStyle = { display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: 'var(--text-primary)' };

  return (
    <div id="product-form">
      <div className="page-header">
        <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bauhaus-blue)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-body)' }}>
          <ArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="page-title">{isEdit ? 'Edit' : 'Add'} Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name & Slug */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><label style={labelStyle}>Name</label><input className="input" value={form.name} onChange={e => updateField('name', e.target.value)} required /></div>
          <div><label style={labelStyle}>Slug</label><input className="input" value={form.slug} onChange={e => updateField('slug', e.target.value)} required /></div>
        </div>

        {/* Description */}
        <div><label style={labelStyle}>Description</label><textarea className="input" rows={4} value={form.description} onChange={e => updateField('description', e.target.value)} required style={{ resize: 'vertical' }} /></div>

        {/* Price, Compare, Stock, Category, Gender */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div><label style={labelStyle}>Price (₹)</label><input className="input" type="number" value={form.price} onChange={e => updateField('price', e.target.value)} required /></div>
          <div><label style={labelStyle}>Compare Price</label><input className="input" type="number" value={form.comparePrice} onChange={e => updateField('comparePrice', e.target.value)} /></div>
          <div><label style={labelStyle}>Stock</label><input className="input" type="number" value={form.stock} onChange={e => updateField('stock', e.target.value)} required /></div>
          <div><label style={labelStyle}>Category</label><select className="input" value={form.categoryId} onChange={e => updateField('categoryId', e.target.value)} required><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={labelStyle}>Gender</label><select className="input" value={(form as any).gender || 'UNISEX'} onChange={e => updateField('gender', e.target.value)} required><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="UNISEX">Unisex</option></select></div>
        </div>

        {/* Sizes */}
        <div>
          <label style={labelStyle}>Sizes</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16, marginBottom: 8 }}>
            {form.sizes?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 4 }}>
                <input className="input" value={s} onChange={e => updateArrayField('sizes', i, e.target.value)} placeholder="Size" />
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('sizes')}>+ Add Size</button>
        </div>

        {/* Colors */}
        <div>
          <label style={labelStyle}>Colors</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16, marginBottom: 8 }}>
            {form.colors?.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 4 }}>
                <input className="input" value={c} onChange={e => updateArrayField('colors', i, e.target.value)} placeholder="Color" />
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('colors')}>+ Add Color</button>
        </div>

        {/* Images */}
        <div>
          <label style={labelStyle}>Images</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginBottom: 8 }}>
            {form.images.map((img, i) => (
              <ImageUpload key={i} value={img} onChange={(url) => updateArrayField('images', i, url)} label={`Image ${i + 1}`} />
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('images')}>+ Add Another Image</button>
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'featured', label: 'Featured' },
            { key: 'bestseller', label: 'Bestseller' },
            { key: 'newArrival', label: 'New Arrival' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div
                onClick={() => updateField(key, !(form as any)[key])}
                style={{
                  width: 22, height: 22,
                  border: '2px solid var(--bauhaus-black)',
                  background: (form as any)[key] ? 'var(--bauhaus-red)' : 'var(--bauhaus-white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px 0px var(--bauhaus-black)',
                }}
              >
                {(form as any)[key] && <span style={{ color: 'white', fontWeight: 900, fontSize: '0.7rem' }}>✓</span>}
              </div>
              {label}
            </label>
          ))}
        </div>

        {/* Bauhaus divider */}
        <div style={{ display: 'flex', gap: 0, height: 3 }}>
          <div style={{ flex: 1, background: 'var(--bauhaus-red)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-blue)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-yellow)' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
