import { useState, useEffect } from 'react';
import { Trash2, Eye, Mail } from 'lucide-react';
import api from '../lib/api';

export default function Contacts() {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => { api.get('/contact').then(r => setMessages(r.data.messages || [])).catch(() => {}); }, []);
  const markRead = async (id: string) => { await api.put(`/contact/${id}/read`); setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m)); };
  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await api.delete(`/contact/${id}`); setMessages(prev => prev.filter(m => m.id !== id)); } };

  return (
    <div id="admin-contacts">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Mail size={24} style={{ color: 'var(--bauhaus-blue)' }} />
          <h1 className="page-title">Contact Messages</h1>
        </div>
        <p className="page-subtitle">{messages.filter(m => !m.isRead).length} unread messages</p>
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {messages.map(m => (
              <tr key={m.id} style={{ opacity: m.isRead ? 0.65 : 1 }}>
                <td style={{ fontWeight: 700 }}>{m.name}</td>
                <td>{m.email}</td>
                <td style={{ fontWeight: 600 }}>{m.subject}</td>
                <td style={{ maxWidth: 250, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</td>
                <td><span className={`badge ${m.isRead ? 'badge-success' : 'badge-warning'}`}>{m.isRead ? 'Read' : 'New'}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!m.isRead && <button className="btn btn-secondary btn-sm" onClick={() => markRead(m.id)}><Eye size={14} /></button>}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No messages yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
