import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

const statIcons = [
  { icon: DollarSign, bg: 'var(--bauhaus-white)', color: 'var(--bauhaus-red)' },
  { icon: ShoppingCart, bg: 'var(--bauhaus-white)', color: 'var(--bauhaus-blue)' },
  { icon: Users, bg: 'var(--bauhaus-white)', color: 'var(--bauhaus-yellow)' },
  { icon: Package, bg: 'var(--bauhaus-white)', color: 'var(--bauhaus-green)' },
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
        <div style={{ background: 'var(--bauhaus-white)', border: '2px solid var(--bauhaus-black)', padding: '10px 14px', boxShadow: '3px 3px 0px 0px var(--bauhaus-black)' }}>
          <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>{label}</p>
          <p style={{ color: 'var(--bauhaus-red)', fontWeight: 900, fontSize: '1.1rem' }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="admin-dashboard">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <TrendingUp size={28} style={{ color: 'var(--bauhaus-red)' }} />
          <h1 className="page-title">Dashboard</h1>
        </div>
        <p className="page-subtitle">Welcome back to FANCLUB Admin</p>
        {/* Bauhaus decorative bar */}
        <div style={{ display: 'flex', gap: 0, marginTop: 12, height: 4, maxWidth: 200 }}>
          <div style={{ flex: 1, background: 'var(--bauhaus-red)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-blue)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-yellow)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-green)' }} />
        </div>
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
                <div style={{ width: 50, height: 50, background: bg, border: '2px solid var(--bauhaus-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, boxShadow: '2px 2px 0px 0px var(--bauhaus-black)' }}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <ArrowUpRight size={20} style={{ color: 'var(--bauhaus-red)' }} />
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Monthly Revenue</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="0" stroke="var(--bauhaus-black)" strokeOpacity={0.1} />
              <XAxis dataKey="month" stroke="var(--bauhaus-black)" fontSize={11} fontWeight={700} tickLine={false} />
              <YAxis stroke="var(--bauhaus-black)" fontSize={11} fontWeight={700} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="var(--bauhaus-red)" radius={0} stroke="var(--bauhaus-black)" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--bauhaus-black)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} style={{ color: 'var(--bauhaus-blue)' }} />
          <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.95rem' }}>Recent Orders</h3>
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
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
