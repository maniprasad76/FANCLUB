import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

const statIcons = [
  { icon: DollarSign, bg: 'rgba(208, 32, 32, 0.1)', color: '#D02020' },
  { icon: ShoppingCart, bg: 'rgba(16, 64, 192, 0.1)', color: '#1040C0' },
  { icon: Users, bg: 'rgba(240, 192, 32, 0.15)', color: '#b88600' },
  { icon: Package, bg: 'rgba(0, 158, 96, 0.1)', color: '#008751' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}` },
    { label: 'Total Orders', value: stats?.totalOrders || 0 },
    { label: 'Total Customers', value: stats?.totalUsers || 0 },
    { label: 'Total Products', value: stats?.totalProducts || 0 },
  ];

  const chartData = stats?.monthlyRevenue ? Object.entries(stats.monthlyRevenue).map(([month, revenue]) => ({
    month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short' }),
    revenue,
  })) : [];

  const statusColors: any = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', SHIPPED: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger' };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(18, 18, 18, 0.1)', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <p style={{ color: 'var(--bauhaus-black)', fontWeight: 800, fontSize: '1.1rem', marginTop: 2 }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="admin-dashboard">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <TrendingUp size={24} style={{ color: 'var(--bauhaus-red)' }} />
          <h1 className="page-title">Dashboard Overview</h1>
        </div>
        <p className="page-subtitle">Real-time metrics and store performance summary</p>
      </div>

      <div className="stats-grid">
        {statCards.map(({ label, value }, index) => {
          const { icon: Icon, bg, color } = statIcons[index];
          return (
            <div key={label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{value}</p>
                </div>
                <div style={{ width: 48, height: 48, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <ArrowUpRight size={20} style={{ color: 'var(--bauhaus-black)' }} />
            <h3 style={{ fontWeight: 800, letterSpacing: '-0.3px', fontSize: '1.05rem' }}>Monthly Revenue</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(18, 18, 18, 0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="var(--bauhaus-black)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={18} style={{ color: 'var(--bauhaus-black)' }} />
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.3px', fontSize: '1rem' }}>Recent Orders</h3>
        </div>
        <table className="data-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {(stats?.recentOrders || []).map((order: any) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700 }}>{order.orderNumber}</td>
                <td>{order.user?.name || '—'}</td>
                <td style={{ fontWeight: 700 }}>₹{order.totalAmount.toLocaleString('en-IN')}</td>
                <td><span className={`badge ${statusColors[order.status] || 'badge-info'}`}>{order.status}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontWeight: 600 }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
