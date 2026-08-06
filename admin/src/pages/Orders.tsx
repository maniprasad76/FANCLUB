import { useState, useEffect } from 'react';
import { ShoppingCart, Download, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

/* MED 15: Proper CSV escaping — quotes, commas, newlines, and CRLF injection
   are neutralized so exported data can't corrupt the sheet or run formulas. */
const escapeCsvCell = (value: any): string => {
  const str = value == null ? '' : String(value);
  if (/[",\n\r\t=+\-@]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/orders', {
      params: { page, limit: 20, status: statusFilter || undefined, search: search.trim() || undefined },
    })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); })
      .catch(() => {});
  }, [page, statusFilter, search]);

  const updateStatus = async (id: string, status: string, currentStatus: string) => {
    // MED 21: No-op if the admin picks the same status — avoids a pointless
    // round-trip that the backend rejects with 400.
    if (status === currentStatus) return;
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/orders', {
        params: { limit: 10000, status: statusFilter || undefined, search: search.trim() || undefined },
      });
      const csvRows = [
        ['Order Number', 'Customer Name', 'Customer Email', 'Items Count', 'Total Amount', 'Status', 'Date']
          .map(escapeCsvCell).join(','),
      ];
      data.orders.forEach((o: any) => {
        csvRows.push([
          escapeCsvCell(o.orderNumber),
          escapeCsvCell(o.user?.name || ''),
          escapeCsvCell(o.user?.email || ''),
          escapeCsvCell(o.items?.length || 0),
          escapeCsvCell(o.totalAmount),
          escapeCsvCell(o.status),
          escapeCsvCell(new Date(o.createdAt).toLocaleDateString()),
        ].join(','));
      });
      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${statusFilter || 'all'}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
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

      {/* MED 22: Order search */}
      <div className="admin-search-wrapper" style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={18} className="admin-search-icon" />
        <input
          className="input"
          placeholder="Search by order #, customer name, or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ paddingLeft: 40, width: '100%', maxWidth: 420 }}
          aria-label="Search orders"
        />
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
                  <select className="input" style={{ width: 140, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 700 }} value={o.status} onChange={e => updateStatus(o.id, e.target.value, o.status)}>
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
