'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Bike, ShoppingBag, Truck,
  ClipboardList, BarChart2, LogOut, Menu, X, ChevronDown,
  RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, Package, Loader2, Search, Filter, Eye,
  UserCheck, UserX, ChevronLeft, ChevronRight, Plus, Settings,
  ImagePlus, Trash2,
  Megaphone,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart,
  Line,
} from 'recharts';
import { fieldStyle, fmtGHS, FormField, PricingModeCard, StatCard, Table } from '../../pages/public/AdminDashboard';
import { OperatingHoursCard } from './OperatingHours';


export function SettingsSection({ authFetch, theme }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [pricingMode, setPricingMode] = useState('FIXED');
  const [fixedPrice, setFixedPrice] = useState('20');
  const [perItemPrice, setPerItemPrice] = useState('5');
  const [pickupLocationId, setPickupLocationId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([authFetch('/admin/settings'), authFetch('/locations')]);
      const [sJson, lJson] = await Promise.all([sRes.json(), lRes.json()]);
      if (lJson.success) setLocations(lJson.data.locations ?? lJson.data);
      if (sJson.success) {
        const s = sJson.data;
        setPricingMode(s.errandPricingMode || 'FIXED');
        setFixedPrice(String(s.errandFixedPrice ?? 20));
        setPerItemPrice(String(s.errandPerItemPrice ?? 5));
        setPickupLocationId(s.errandPickupLocationId || '');
      }
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await authFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          errandPricingMode: pricingMode,
          errandFixedPrice: parseFloat(fixedPrice) || 0,
          errandPerItemPrice: parseFloat(perItemPrice) || 0,
          errandPickupLocationId: pickupLocationId || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not save settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setSaving(false);
  }

  if (loading) {
    return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Loader2 size={24} style={{ animation:'spin 1s linear infinite', color: theme.green }}/></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Settings</h2>
        <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Platform-wide configuration</p>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'22px 24px', marginBottom:20, maxWidth:640 }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 4px' }}>Errand Pricing</h3>
        <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 18px' }}>
          Controls how much is charged on top of the delivery fee when a customer books an errand.
        </p>

        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <PricingModeCard active={pricingMode==='FIXED'} onClick={() => setPricingMode('FIXED')} theme={theme}
            title="Fixed errand price" desc="One flat fee added to every errand, regardless of item count." />
          <PricingModeCard active={pricingMode==='PER_ITEM'} onClick={() => setPricingMode('PER_ITEM')} theme={theme}
            title="Per-item price" desc="Charge a fee for each item line the customer adds to the errand list." />
        </div>

        {pricingMode === 'FIXED' ? (
          <FormField label="Fixed errand price (GHS)">
            <input style={fieldStyle} value={fixedPrice} onChange={e=>setFixedPrice(e.target.value)} inputMode="decimal" placeholder="20"/>
          </FormField>
        ) : (
          <FormField label="Price per errand item (GHS)">
            <input style={fieldStyle} value={perItemPrice} onChange={e=>setPerItemPrice(e.target.value)} inputMode="decimal" placeholder="5"/>
          </FormField>
        )}

        <FormField label="Errand pickup location">
          <select style={fieldStyle} value={pickupLocationId} onChange={e=>setPickupLocationId(e.target.value)}>
            <option value="">Select a saved location…</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>
            Every errand request will use this as its pickup point (e.g. "Agona Nkwanta Market"). Add it under Locations first if it's missing from the list.
          </div>
        </FormField>

        {error && <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:10 }}>{error}</div>}
        {saved && <div style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:10 }}>Settings saved.</div>}

        <button onClick={save} disabled={saving || !pickupLocationId} style={{
          marginTop:16, height:42, padding:'0 20px', border:'none', borderRadius:10, fontWeight:800, fontSize:13, fontFamily:'inherit',
          background: (saving || !pickupLocationId) ? '#d1d5db' : theme.green, color:'#fff', cursor: (saving||!pickupLocationId) ? 'not-allowed':'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          {saving ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving...</> : 'Save Settings'}
        </button>
      </div>
        <OperatingHoursCard authFetch={authFetch} theme={theme}/>
      
    </div>
  );
}

