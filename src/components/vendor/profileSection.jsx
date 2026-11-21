import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, Loader2, Package, Pencil, Plus, Save, Search, Store, ToggleRight, Trash2 } from "lucide-react";
import { CATEGORIES, CATEGORY_ICONS, FInput } from "../../pages/vendor/VendorDashboard";
import { ProductModal } from "./productModal";
import { StatusBadge } from "../../pages/customer/AdminDashboard";


export function Profile({ authFetch, theme, vendor, onVendorUpdate }) {
  const [form, setForm]     = useState({ businessName:'', businessType:'Food', address:'', phone:'', logo:'', openingHours:'' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      businessName: vendor.businessName || '',
      businessType: vendor.businessType || 'Food',
      address:      vendor.address || '',
      phone:        vendor.phone || '',
      logo:         vendor.logo || '',
      openingHours: vendor.openingHours || '',
    });
  }, [vendor]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  async function save() {
    setSaving(true);
    try {
      const res  = await authFetch('/vendors/me/profile', { method:'PATCH', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        onVendorUpdate(json.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  }

  const TYPES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Store Profile</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Manage your store information</p>
        </div>
        {vendor?.status && <StatusBadge status={vendor.status}/>}
      </div>

      {vendor?.status === 'PENDING' && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:14, color:'#92400e', display:'flex', gap:10 }}>
          <AlertCircle size={18} style={{ flexShrink:0 }}/>
          Your store is pending admin approval. You can still set up your profile and products — they'll go live once approved.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="profile-grid">

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* LOGO PREVIEW */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:'0 0 14px' }}>Store Logo</h3>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:72, height:72, borderRadius:14, border:'1.5px solid #e5e7eb', overflow:'hidden', flexShrink:0, background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {form.logo
                  ? <img src={form.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                  : <Store size={28} style={{ color:'#d1d5db' }}/>
                }
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Logo URL</label>
                <input value={form.logo} onChange={e=>set('logo',e.target.value)}
                  placeholder="https://your-logo-url.com/logo.png"
                  style={{ width:'100%', height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                <p style={{ fontSize:11, color:'#9ca3af', margin:'4px 0 0' }}>Paste any image URL</p>
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:0 }}>Business Info</h3>
            <FInput label="Business Name" value={form.businessName} onChange={v=>set('businessName',v)} required placeholder="e.g. Akosua Kitchen"/>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Business Type</label>
              <select value={form.businessType} onChange={e=>set('businessType',e.target.value)}
                style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
                {TYPES.map(t => <option key={t} value={t}>{CATEGORY_ICONS[t]} {t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:0 }}>Contact & Location</h3>
            <FInput label="Phone Number" value={form.phone} onChange={v=>set('phone',v)} required placeholder="0241234567"/>
            <FInput label="Address" value={form.address} onChange={v=>set('address',v)} required placeholder="e.g. Market Street, Agona Nkwanta" textarea rows={2}/>
            <FInput label="Opening Hours" value={form.openingHours} onChange={v=>set('openingHours',v)} placeholder="e.g. Mon-Sat 7am-9pm"/>
          </div>

          {/* STORE STATS SUMMARY */}
          {vendor && (
            <div style={{ background:`linear-gradient(135deg, ${theme.green}12, ${theme.greenMid}08)`, borderRadius:14, border:`1px solid ${theme.green}30`, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:'0 0 12px' }}>Quick Stats</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Rating', value:`⭐ ${Number(vendor.rating||0).toFixed(1)}` },
                  { label:'Status', value: vendor.status },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#0f1117', marginTop:2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAVE */}
      <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={save} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
          {saving ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={16}/>}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}><CheckCircle size={14}/> Saved successfully!</span>}
      </div>
    </div>
  );
}
