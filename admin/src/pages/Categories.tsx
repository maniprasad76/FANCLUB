import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import api from '../lib/api';
import ImageUpload from '../components/ImageUpload';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '' });
  const [editId, setEditId] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetch = () => api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) await api.put(`/categories/${editId}`, form);
    else await api.post('/categories', form);
    setForm({ name: '', slug: '', description: '', image: '' });
    setEditId('');
    setShowForm(false);
    fetch();
  };

  const handleEdit = (cat: any) => { setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image || '' }); setEditId(cat.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await api.delete(`/categories/${id}`); fetch(); } };

  const labelStyle = { display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: 'var(--text-primary)' };

  return (
    <div id="admin-categories">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <FolderOpen size={24} style={{ color: 'var(--bauhaus-yellow)' }} />
            <h1 className="page-title">Categories</h1>
          </div>
          <p className="page-subtitle">{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(''); setForm({ name: '', slug: '', description: '', image: '' }); }}><Plus size={16} /> Add Category</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: 24, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Name</label><input className="input" placeholder="Category name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label style={labelStyle}>Slug</label><input className="input" placeholder="category-slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required /></div>
          </div>
          <div><label style={labelStyle}>Description</label><input className="input" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <ImageUpload value={form.image} onChange={(url) => setForm({...form, image: url})} label="Category Image" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{c.slug}</td>
                <td><span className="badge badge-info">{c._count?.products || 0}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No categories yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
