import { useState, useEffect } from 'react';
import { Trash2, Star as StarIcon } from 'lucide-react';
import api from '../lib/api';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => { api.get('/reviews').then(r => setReviews(r.data.reviews || [])).catch(() => {}); }, []);
  const handleDelete = async (id: string) => { if (confirm('Delete review?')) { await api.delete(`/reviews/${id}`); setReviews(prev => prev.filter(r => r.id !== id)); } };

  return (
    <div id="admin-reviews">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <StarIcon size={24} style={{ color: 'var(--bauhaus-yellow)' }} />
          <h1 className="page-title">Reviews</h1>
        </div>
        <p className="page-subtitle">{reviews.length} total reviews</p>
      </div>

      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>User</th><th>Product</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }}>{r.user?.name || '—'}</td>
                <td style={{ fontWeight: 700 }}>{r.product?.name || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        size={16}
                        fill={i < r.rating ? 'var(--bauhaus-yellow)' : 'transparent'}
                        stroke={i < r.rating ? 'var(--bauhaus-black)' : 'var(--text-muted)'}
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                </td>
                <td style={{ maxWidth: 300, color: 'var(--text-secondary)' }}>{r.comment || '—'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>No reviews yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
