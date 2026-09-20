'use client';
import { useState, useEffect, useCallback } from 'react';
import { Table, Pagination } from '../../pages/public/AdminDashboard';

const ACTION_STYLES = {
  ORDER_STATUS_CHANGE:     { label: 'Order Status',     color: '#1e40af', bg: '#dbeafe' },
  ORDER_RIDER_ASSIGN:      { label: 'Order Assignment', color: '#5b21b6', bg: '#ede9fe' },
  DELIVERY_STATUS_CHANGE:  { label: 'Delivery Status',  color: '#0369a1', bg: '#e0f2fe' },
  DELIVERY_RIDER_ASSIGN:   { label: 'Delivery Assignment', color: '#0369a1', bg: '#e0f2fe' },
  VENDOR_STATUS_CHANGE:    { label: 'Vendor Status',    color: '#92400e', bg: '#fef3c7' },
  VENDOR_CREATED:          { label: 'Vendor Created',   color: '#065f46', bg: '#d1fae5' },
  VENDOR_PROFILE_UPDATED:  { label: 'Vendor Updated',   color: '#065f46', bg: '#d1fae5' },
  USER_STATUS_CHANGE:      { label: 'User Status',      color: '#991b1b', bg: '#fee2e2' },
  PRODUCT_CREATED:         { label: 'Product Added',    color: '#065f46', bg: '#d1fae5' },
  PRODUCT_DELETED:         { label: 'Product Deleted',  color: '#991b1b', bg: '#fee2e2' },
  BROADCAST_SENT:          { label: 'Broadcast',        color: '#7c3aed', bg: '#ede9fe' },
};

function ActionBadge({ action }) {
  const s = ACTION_STYLES[action] || { label: action, color: '#374151', bg: '#f3f4f6' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export function ActivityLogSection({ authFetch }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [action, setAction]   = useState('');

  const load = useCallback(async (p = 1, a = action) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 25, ...(a && { action: a }) });
      const res = await authFetch(`/admin/logs?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.logs); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, action]);

  useEffect(() => { load(1, action); }, [action]);

  const columns = [
    { key: 'action', label: 'Action', render: r => <ActionBadge action={r.action} /> },
    { key: 'summary', label: 'What happened', render: r => <span style={{ fontWeight: 600 }}>{r.summary}</span> },
    { key: 'admin', label: 'Admin', render: r => <div><div style={{ fontWeight: 700 }}>{r.admin?.name || 'Unknown'}</div><div style={{ color: '#9ca3af', fontSize: 12 }}>{r.admin?.phone}</div></div> },
    { key: 'createdAt', label: 'When', render: r => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>Activity Log</h2>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={action} onChange={e => setAction(e.target.value)}
          style={{ height: 38, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_STYLES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No admin activity recorded yet" />
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}