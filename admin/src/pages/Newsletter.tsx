import { useState, useEffect } from 'react';
import { Trash2, Newspaper } from 'lucide-react';
import api from '../lib/api';

export default function Newsletter() {
  const [subs, setSubs] = useState<any[]>([]);
  useEffect(() => { api.get('/newsletter').then(r => setSubs(r.data.subscribers || [])).catch(() => {}); }, []);
  const handleDelete = async (id: string) => { await api.delete(`/newsletter/${id}`); setSubs(prev => prev.filter(s => s.id !== id)); };

  return (
    <div id="admin-newsletter">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Newspaper size={24} style={{ color: 'var(--bauhaus-red)' }} />
          <h1 className="page-title">Newsletter</h1>
        </div>
        <p className="page-subtitle">{subs.length} subscribers</p>
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Email</th><th>Subscribed</th><th>Actions</th></tr></thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700 }}>{s.email}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No subscribers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
