import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    const params: any = { page, limit: 15 };
    if (searchTerm) params.search = searchTerm;
    if (actionFilter) params.action = actionFilter;

    api.get('/audit-logs', { params })
      .then(r => {
        setLogs(r.data.logs);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeClass = (action: string) => {
    if (action.startsWith('CREATE')) return 'badge-success';
    if (action.startsWith('UPDATE')) return 'badge-info';
    if (action.startsWith('DELETE') || action.includes('REFUND')) return 'badge-danger';
    return 'badge-warning';
  };

  const toggleExpand = (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const labelStyle = { 
    display: 'block', 
    marginBottom: 6, 
    fontSize: '0.72rem', 
    fontWeight: 700, 
    textTransform: 'uppercase' as const, 
    letterSpacing: '2px', 
    color: 'var(--text-primary)' 
  };

  return (
    <div id="admin-audit-logs">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShieldAlert size={24} style={{ color: 'var(--bauhaus-red)' }} />
            <h1 className="page-title">Security Audit Logs</h1>
          </div>
          <p className="page-subtitle">Administrative action log — {total} events tracked</p>
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={fetchLogs} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <label style={labelStyle}>Search</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="input" 
                placeholder="Search by action, email, target ID..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={{ paddingLeft: 36 }}
              />
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>
          
          <div style={{ width: 200 }}>
            <label style={labelStyle}>Action Filter</label>
            <select 
              className="input" 
              value={actionFilter} 
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              style={{ height: 42, background: 'var(--bauhaus-white)' }}
            >
              <option value="">All Actions</option>
              <option value="CREATE_PRODUCT">Create Product</option>
              <option value="UPDATE_PRODUCT">Update Product</option>
              <option value="DELETE_PRODUCT">Delete Product</option>
              <option value="BULK_DELETE_PRODUCTS">Bulk Delete Products</option>
              <option value="CREATE_CATEGORY">Create Category</option>
              <option value="UPDATE_CATEGORY">Update Category</option>
              <option value="DELETE_CATEGORY">Delete Category</option>
              <option value="PROCESS_REFUND">Refund Payment</option>
              <option value="UPLOAD_FOOTER_VIDEO">Upload Footer Video</option>
              <option value="DELETE_FOOTER_VIDEO">Delete Footer Video</option>
              <option value="UPLOAD_ABOUT_IMAGE">Upload About Image</option>
              <option value="DELETE_ABOUT_IMAGE">Delete About Image</option>
              <option value="TOGGLE_COD_STATUS">Toggle COD Payment</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Timestamp</th>
              <th>Performed By</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const isExpanded = expandedLogId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(log.id)}>
                    <td>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {log.userEmail || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>System</span>}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {log.targetType || '-'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.ipAddress || 'Unknown'}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: '#f9f9f9', borderBottom: '3px solid var(--bauhaus-black)' }}>
                        <div style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                            Target ID: <span style={{ color: 'var(--bauhaus-blue)' }}>{log.targetId || 'N/A'}</span>
                          </p>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                            User Agent: <span style={{ color: 'var(--text-primary)' }}>{log.userAgent || 'N/A'}</span>
                          </p>
                          
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div>
                              <p style={{ margin: '0 0 6px 0', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                Changes Payload:
                              </p>
                              <pre style={{ 
                                margin: 0, 
                                padding: 14, 
                                background: '#121212', 
                                color: '#00ff00', 
                                border: '2px solid var(--bauhaus-black)',
                                overflow: 'auto',
                                maxHeight: '300px'
                              }}>
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  No security logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontFamily: 'monospace', fontWeight: 700 }}>
            {page} / {pages}
          </span>
          <button 
            className="btn btn-secondary btn-sm" 
            disabled={page === pages} 
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
