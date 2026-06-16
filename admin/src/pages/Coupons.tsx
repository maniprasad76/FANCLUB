import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [limit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    value: 0,
    minCartAmount: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  });

  const fetchCoupons = () => {
    api.get(`/coupons?page=${page}&limit=${limit}`)
      .then(r => {
        setCoupons(r.data.coupons || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        code: form.code,
        discountType: form.discountType,
        value: Number(form.value),
        minCartAmount: form.minCartAmount ? Number(form.minCartAmount) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
      };

      if (editId) {
        await api.put(`/coupons/${editId}`, payload);
        toast.success('Coupon updated successfully');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created successfully');
      }

      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon: any) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: Number(coupon.value),
      minCartAmount: coupon.minCartAmount ? String(coupon.minCartAmount) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      isActive: coupon.isActive,
    });
    setEditId(coupon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.delete(`/coupons/${id}`);
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } catch {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const toggleStatus = async (coupon: any) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch {
      toast.error('Failed to toggle coupon status');
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      value: 0,
      minCartAmount: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      isActive: true,
    });
    setEditId('');
    setShowForm(false);
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    color: 'var(--text-primary)',
  };

  return (
    <div id="admin-coupons">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Ticket size={24} style={{ color: 'var(--bauhaus-red)' }} />
            <h1 className="page-title">Coupons</h1>
          </div>
          <p className="page-subtitle">{total} coupons configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: 24, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Coupon Code</label>
              <input
                className="input"
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select
                className="input"
                value={form.discountType}
                onChange={e => setForm({ ...form, discountType: e.target.value })}
                required
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Discount Value</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 10 or 150"
                value={form.value}
                onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                required
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Min Cart Amount (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 500"
                value={form.minCartAmount}
                onChange={e => setForm({ ...form, minCartAmount: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Max Discount (₹ - Optional)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 200"
                value={form.maxDiscount}
                onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Usage Limit</label>
              <input
                type="number"
                className="input"
                placeholder="Total times usable"
                value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="isActive" style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer' }}>
              Is Active
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Cart</th>
              <th>Limit / Used</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id}>
                <td style={{ fontWeight: 700, letterSpacing: '1px' }}>{coupon.code}</td>
                <td>
                  <span className={`badge ${coupon.discountType === 'PERCENTAGE' ? 'badge-primary' : 'badge-success'}`}>
                    {coupon.discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `₹${Number(coupon.value).toFixed(2)}`}
                </td>
                <td>
                  {coupon.minCartAmount ? `₹${Number(coupon.minCartAmount).toFixed(2)}` : '—'}
                </td>
                <td style={{ fontFamily: 'monospace' }}>
                  {coupon.usageLimit ? `${coupon.usedCount} / ${coupon.usageLimit}` : `${coupon.usedCount} / ∞`}
                </td>
                <td>
                  <button
                    onClick={() => toggleStatus(coupon)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No expiry'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(coupon)}><Edit size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(coupon.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  No coupons configured yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
