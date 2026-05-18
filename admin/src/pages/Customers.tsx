import { useState, useEffect } from 'react';
import { Users, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export default function Customers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { page, limit: 20 } }).then(r => { setUsers(r.data.users); setTotal(r.data.total); }).catch(() => {});
  }, [page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/users', { params: { limit: 10000 } });
      const csvRows = [['Name', 'Email', 'Phone', 'Role', 'Joined Date'].join(',')];
      data.users.forEach((u: any) => {
        csvRows.push([
          `"${u.name || ''}"`,
          u.email,
          u.phone || '',
          u.role,
          new Date(u.createdAt).toLocaleDateString()
        ].join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${Date.now()}.csv`;
      a.click();
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
    setExporting(false);
  };

  return (
    <div id="admin-customers">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Users size={24} style={{ color: 'var(--bauhaus-blue)' }} />
            <h1 className="page-title">Customers</h1>
          </div>
          <p className="page-subtitle">{total} total users</p>
        </div>
        <button className="btn btn-outline" onClick={handleExport} disabled={exporting || total === 0}>
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32,
                      background: 'var(--bauhaus-blue)',
                      border: '2px solid var(--bauhaus-black)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase'
                    }}>
                      {(u.name || '?')[0]}
                    </div>
                    <span style={{ fontWeight: 700 }}>{u.name || '—'}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-success'}`}>{u.role}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
