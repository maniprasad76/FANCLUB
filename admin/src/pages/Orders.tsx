import { useState, useEffect } from 'react';
import { ShoppingCart, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/orders', { params: { page, limit: 20, status: statusFilter || undefined } })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); })
      .catch(() => {});
  }, [page, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (e) {
      toast.error('Failed to update order status');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/orders', { params: { limit: 10000, status: statusFilter || undefined } });
      const csvRows = [['Order Number', 'Customer Name', 'Customer Email', 'Items Count', 'Total Amount', 'Status', 'Date'].join(',')];
      data.orders.forEach((o: any) => {
        csvRows.push([
          o.orderNumber,
          `"${o.user?.name || ''}"`,
          o.user?.email || '',
          o.items?.length || 0,
          o.totalAmount,
          o.status,
          new Date(o.createdAt).toLocaleDateString()
        ].join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${statusFilter || 'all'}_${Date.now()}.csv`;
      a.click();
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
    setExporting(false);
  };

  const statuses = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const statusColors: any = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', PROCESSING: 'badge-info', SHIPPED: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger' };

  const totalPages = Math.ceil(total / 20);

  return (
    <div id="admin-orders">
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShoppingCart size={24} style={{ color: 'var(--bauhaus-red)' }} />
            <h1 className="page-title">Orders</h1>
          </div>
          <p className="page-subtitle">{total} total orders</p>
        </div>
        <button className="btn btn-outline" onClick={handleExport} disabled={exporting || total === 0}>
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                <td>
                  <div>{o.user?.name || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{o.user?.email}</div>
                </td>
                <td><span className="badge badge-info">{o.items?.length || 0}</span></td>
                <td style={{ fontWeight: 700 }}>₹{o.totalAmount.toLocaleString('en-IN')}</td>
                <td><span className={`badge ${statusColors[o.status] || 'badge-info'}`}>{o.status}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <select className="input" style={{ width: 140, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 700 }} value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                    {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No orders found</td></tr>
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
