import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Package, Pencil, Plus, RefreshCw, Search, ToggleRight, Trash2 } from "lucide-react";
import { CATEGORIES } from "../../pages/vendor/VendorDashboard";
import { ProductModal } from "./productModal";
import { StatusBadge } from "../../pages/customer/AdminDashboard";
import { FLOW, TABS } from "../../pages/vendor/VendorDashboardPro";
import { Badge, btn, card, fmt, inputS, money, short } from "./ui";
import { InfoCard } from "../admin/OrderDetailModal";


export function Orders({ orders, onOpen, act, acting }) {
  const [tab, setTab] = useState('ALL');
  const [q, setQ] = useState('');
  const [pay, setPay] = useState('');
  const counts = Object.fromEntries(TABS.map(t => [t.id, t.match ? orders.filter(o => t.match.includes(o.orderStatus)).length : orders.length]));
  const list = orders.filter(o => {
    const t = TABS.find(x => x.id === tab);
    if (t.match && !t.match.includes(o.orderStatus)) return false;
    if (pay && o.paymentMethod !== pay) return false;
    const s = q.toLowerCase();
    return !s || short(o.id).toLowerCase().includes(s) || o.customer?.name?.toLowerCase().includes(s) || o.customer?.phone?.includes(s);
  });
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 14px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: tab === t.id ? '#16a34a' : '#f3f4f6', color: tab === t.id ? '#fff' : '#6b7280' }}>
            {t.label} <span style={{ opacity: 0.8 }}>{counts[t.id]}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#9ca3af' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order ID, customer, phone…" style={{ ...inputS, paddingLeft: 34 }} />
        </div>
        <select value={pay} onChange={e => setPay(e.target.value)} style={{ ...inputS, width: 150 }}>
          <option value="">All payments</option><option value="CASH">Cash</option><option value="MOMO">MoMo</option>
        </select>
      </div>
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {!list.length ? <Empty text="No orders match" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Order', 'Customer', 'Items', 'Payment', 'Total', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>)}
              </tr></thead>
              <tbody>{list.map(o => (
                <tr key={o.id} onClick={() => onOpen(o)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 14px' }}><div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6b7280' }}>{short(o.id)}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(o.createdAt)}</div></td>
                  <td style={{ padding: '12px 14px' }}><b>{o.customer?.name}</b><div style={{ fontSize: 12, color: '#9ca3af' }}>{o.customer?.phone}</div></td>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>
                    {(o.items?.length > 0 || o.notes) && (
                                    <InfoCard title="Items" icon={<Package size={14} />}>
                                      {o.items?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                          {o.items.map((it, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                              <span style={{ color: '#374151' }}>{it.quantity}× {it.name}</span>
                                              <span style={{ fontWeight: 700, color: '#0f1117' }}>{fmtGHS(it.price)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 13, color: '#374151' }}>{o.notes}</div>
                                      )}
                                    </InfoCard>
                                  )}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>{o.paymentMethod}<div style={{ color: o.paymentStatus === 'PAID' ? '#16a34a' : '#f59e0b', fontWeight: 700 }}>{}</div></td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#10b981' }}>{money(o.totalAmount)}</td>
                  <td style={{ padding: '12px 14px' }}><Badge status={o.orderStatus} /></td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    {FLOW[o.orderStatus] && <button disabled={acting === o.id} style={btn('#16a34a')} onClick={() => act(o.id, FLOW[o.orderStatus][0])}>{acting === o.id ? '…' : FLOW[o.orderStatus][1]}</button>}
                  </td>
                </tr>))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}