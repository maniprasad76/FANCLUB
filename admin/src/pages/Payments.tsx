import { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  Globe,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const statusColors: Record<string, string> = {
  COMPLETED: 'badge-success',
  PENDING: 'badge-warning',
  PROCESSING: 'badge-info',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-info',
  PARTIALLY_REFUNDED: 'badge-warning',
  CANCELLED: 'badge-danger',
};

const statusIcons: Record<string, any> = {
  COMPLETED: <CheckCircle2 size={14} />,
  PENDING: <Clock size={14} />,
  FAILED: <XCircle size={14} />,
  REFUNDED: <RefreshCw size={14} />,
};

export default function Payments() {
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    api.get('/payments/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/payments/admin/list', {
      params: {
        page,
        limit: 20,
        status: statusFilter || undefined,
        gateway: gatewayFilter || undefined,
      },
    }).then(r => {
      setPayments(r.data.payments);
      setTotal(r.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, statusFilter, gatewayFilter]);

  const handleRefund = async (paymentId: string) => {
    setRefunding(true);
    try {
      await api.post(`/payments/refund/${paymentId}`, {
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason || undefined,
      });
      toast.success('Refund initiated successfully');
      setShowRefundModal(null);
      setRefundAmount('');
      setRefundReason('');
      // Refresh data
      api.get('/payments/admin/stats').then(r => setStats(r.data));
      api.get('/payments/admin/list', { params: { page, limit: 20, status: statusFilter || undefined, gateway: gatewayFilter || undefined } })
        .then(r => { setPayments(r.data.payments); setTotal(r.data.total); });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
    setRefunding(false);
  };

  const statCards = [
    {
      label: 'Total Collected',
      value: `₹${(stats?.totalCollected || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      bg: '#FFEBEE',
      color: '#D02020',
    },
    {
      label: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: TrendingUp,
      bg: '#E8F5E9',
      color: '#2E7D32',
    },
    {
      label: 'Pending',
      value: stats?.pendingPayments || 0,
      icon: Clock,
      bg: '#FFF8E1',
      color: '#F0C020',
    },
    {
      label: 'Total Refunded',
      value: `₹${(stats?.totalRefunded || 0).toLocaleString('en-IN')}`,
      icon: RefreshCw,
      bg: '#E3F2FD',
      color: '#1040C0',
    },
  ];

  const statuses = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'];
  const gateways = ['', 'RAZORPAY', 'STRIPE', 'COD'];
  const totalPages = Math.ceil(total / 20);

  return (
    <div id="admin-payments">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <CreditCard size={28} style={{ color: 'var(--bauhaus-red)' }} />
          <h1 className="page-title">Payments</h1>
        </div>
        <p className="page-subtitle">Payment gateway dashboard — Razorpay + Stripe</p>
        <div style={{ display: 'flex', gap: 0, marginTop: 12, height: 4, maxWidth: 200 }}>
          <div style={{ flex: 1, background: 'var(--bauhaus-red)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-blue)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-yellow)' }} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
              <div style={{ width: 50, height: 50, background: bg, border: '2px solid var(--bauhaus-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, boxShadow: '2px 2px 0px 0px var(--bauhaus-black)' }}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gateway Breakdown */}
      {stats?.byGateway && stats.byGateway.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {stats.byGateway.map((g: any) => (
            <div key={g.gateway} className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bauhaus-black)',
                background: g.gateway === 'RAZORPAY' ? '#E3F2FD' : g.gateway === 'STRIPE' ? '#F3E5F5' : '#FFF8E1',
                boxShadow: '2px 2px 0px 0px var(--bauhaus-black)',
              }}>
                {g.gateway === 'STRIPE' ? <Globe size={18} /> : <CreditCard size={18} />}
              </div>
              <div>
                <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>{g.gateway}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{(g._sum?.amount || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g._count?.gateway || 0} payments</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {gateways.map(g => (
            <button key={g} className={`btn btn-sm ${gatewayFilter === g ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setGatewayFilter(g); setPage(1); }}>
              {g || 'All Gateways'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Gateway</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="spin" style={{ display: 'inline-block' }} /></td></tr>
            )}
            {!loading && payments.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700 }}>{p.order?.orderNumber || '—'}</td>
                <td>
                  <div>{p.order?.user?.name || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.order?.user?.email}</div>
                </td>
                <td>
                  <span className={`badge ${p.gateway === 'RAZORPAY' ? 'badge-info' : p.gateway === 'STRIPE' ? 'badge-primary' : 'badge-warning'}`}>
                    {p.gateway}
                  </span>
                </td>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                <td style={{ textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 600 }}>{p.method || '—'}</td>
                <td>
                  <span className={`badge ${statusColors[p.status] || 'badge-info'}`}>
                    {statusIcons[p.status]} {p.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  {p.status === 'COMPLETED' && (
                    <button className="btn btn-sm btn-outline" onClick={() => setShowRefundModal(p.id)}>
                      <RefreshCw size={12} /> Refund
                    </button>
                  )}
                  {p.status === 'FAILED' && (
                    <span style={{ color: 'var(--bauhaus-red)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <AlertTriangle size={12} /> Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && payments.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Recent Webhooks */}
      {stats?.recentWebhooks && stats.recentWebhooks.length > 0 && (
        <div className="glass" style={{ overflow: 'auto', padding: 0, marginTop: 28 }}>
          <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--bauhaus-black)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={18} style={{ color: 'var(--bauhaus-blue)' }} />
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.95rem' }}>Recent Webhooks</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Gateway</th>
                <th>Event</th>
                <th>Processed</th>
                <th>Error</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentWebhooks.map((wh: any) => (
                <tr key={wh.id}>
                  <td><span className={`badge ${wh.gateway === 'RAZORPAY' ? 'badge-info' : 'badge-primary'}`}>{wh.gateway}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{wh.eventType}</td>
                  <td>{wh.processed ? <CheckCircle2 size={16} style={{ color: '#2E7D32' }} /> : <Clock size={16} style={{ color: '#F0C020' }} />}</td>
                  <td style={{ color: 'var(--bauhaus-red)', fontSize: '0.78rem' }}>{wh.error || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(wh.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
        }} onClick={() => setShowRefundModal(null)}>
          <div className="glass" style={{ padding: 32, maxWidth: 420, width: '90%', border: '3px solid var(--bauhaus-black)', boxShadow: '8px 8px 0px 0px var(--bauhaus-black)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>
              <RefreshCw size={18} style={{ marginRight: 8 }} /> Initiate Refund
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Amount (leave empty for full refund)
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="Refund amount (₹)"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
              />
              <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Reason
              </label>
              <input
                className="input-field"
                placeholder="Reason for refund"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={() => handleRefund(showRefundModal)} disabled={refunding} style={{ flex: 1 }}>
                  {refunding ? <><Loader2 size={14} className="spin" /> Processing...</> : 'Process Refund'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowRefundModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
