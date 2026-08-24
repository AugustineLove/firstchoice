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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';
import { BroadcastSection } from '../../components/admin/NavComponents';
import { OperatingHoursCard } from '../../components/admin/OperatingHours';
import RiderInsights from '../../components/RiderInsights';
/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
export function Badge({ text, color, bg }) {
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50,
      background: bg, color: color, whiteSpace:'nowrap',
    }}>{text}</span>
  );
}

export const STATUS_STYLES = {
  ACTIVE:          { color:'#065f46', bg:'#d1fae5' },
  PENDING:         { color:'#92400e', bg:'#fef3c7' },
  SUSPENDED:       { color:'#991b1b', bg:'#fee2e2' },
  INACTIVE:        { color:'#374151', bg:'#f3f4f6' },
  ONLINE:          { color:'#065f46', bg:'#d1fae5' },
  OFFLINE:         { color:'#374151', bg:'#f3f4f6' },
  BUSY:            { color:'#1e40af', bg:'#dbeafe' },
  DELIVERED:       { color:'#065f46', bg:'#d1fae5' },
  CANCELLED:       { color:'#991b1b', bg:'#fee2e2' },
  PICKED_UP:       { color:'#1e40af', bg:'#dbeafe' },
  PREPARING:       { color:'#92400e', bg:'#fef3c7' },
  RIDER_ASSIGNED:  { color:'#5b21b6', bg:'#ede9fe' },
  READY_FOR_PICKUP:{ color:'#0369a1', bg:'#e0f2fe' },
  ACCEPTED:        { color:'#065f46', bg:'#d1fae5' },
  IN_TRANSIT:      { color:'#1e40af', bg:'#dbeafe' },
  CUSTOMER:        { color:'#1e40af', bg:'#dbeafe' },
  VENDOR:          { color:'#065f46', bg:'#d1fae5' },
  RIDER:           { color:'#92400e', bg:'#fef3c7' },
  ADMIN:           { color:'#5b21b6', bg:'#ede9fe' },
  PICKUP: { color:'#374151', bg:'#f3f4f6' },
ERRAND: { color:'#7c3aed', bg:'#ede9fe' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { color:'#374151', bg:'#f3f4f6' };
  return <Badge text={status?.replace(/_/g,' ')} color={s.color} bg={s.bg} />;
}

export function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div style={{
      background:'#fff', borderRadius:14, padding:'22px 24px',
      border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background: color + '18', display:'flex', alignItems:'center', justifyContent:'center', color }}>
          {icon}
        </div>
      </div>
      {loading
        ? <div style={{ height:32, width:'60%', borderRadius:8, background:'#f3f4f6', animation:'pulse 1.5s infinite' }}/>
        : <div style={{ fontSize:28, fontWeight:900, color:'#0f1117', letterSpacing:'-1px' }}>{value ?? '—'}</div>
      }
      <div style={{ fontSize:13, color:'#6b7280', marginTop:4, fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export function Table({ columns, data, loading, emptyMsg = 'No records found' }) {
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9ca3af', gap:10 }}>
      <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
    </div>
  );
  if (!data?.length) return (
    <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom:'1px solid #f9fafb', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:'13px 16px', color:'#374151', verticalAlign:'middle' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px 0' }}>
      <button onClick={() => onChange(page-1)} disabled={page===1}
        style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: page===1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page===1?0.4:1 }}>
        <ChevronLeft size={14}/>
      </button>
      <span style={{ fontSize:13, color:'#6b7280', padding:'0 8px' }}>Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page+1)} disabled={page===totalPages}
        style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: page===totalPages?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page===totalPages?0.4:1 }}>
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

/* Small labeled text input, reused across the vendor form modal */
export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export const fieldStyle = {
  width: '100%', height: 40, border: '1.5px solid #e5e7eb', borderRadius: 8,
  padding: '0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

const BUSINESS_TYPES = ['Food', 'Grocery', 'Pharmacy', 'Boutique', 'Electronics', 'Drinks', 'Other'];
const PRODUCT_CATEGORY_EMOJI = { Food:'🍛', Grocery:'🛒', Pharmacy:'💊', Boutique:'👗', Electronics:'📱', Drinks:'🥤', Other:'📦' };

/* ═══════════════════════════════════════════════
   VENDOR FORM MODAL — create a vendor / edit its
   profile / do simple (non-variant) product adds.
   Assumed endpoints (adjust to match your API):
     POST   /admin/vendors                 create vendor + owner account
     PATCH  /admin/vendors/:id             update vendor profile
     POST   /admin/vendors/:id/products     add a basic product for that vendor
     DELETE /products/:id                   remove a product (existing vendor-app endpoint)
═══════════════════════════════════════════════ */
function VendorFormModal({ vendor, onClose, onSaved, authFetch, theme }) {
  const [tab, setTab] = useState('profile');

  // ── profile fields ──
  const [businessName, setBusinessName] = useState(vendor?.businessName || '');
  const [businessType, setBusinessType] = useState(vendor?.businessType || 'Food');
  const [address, setAddress]           = useState(vendor?.address || '');
  const [phone, setPhone]               = useState(vendor?.phone || vendor?.user?.phone || '');
  const [openingHours, setOpeningHours] = useState(vendor?.openingHours || '');
  const [logo, setLogo]                 = useState(vendor?.logo || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError]       = useState(null);

  // ── owner account fields (only used when creating a brand-new vendor) ──
  const [ownerName, setOwnerName]   = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const [savedVendor, setSavedVendor] = useState(vendor || null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  // ── products (only once the vendor exists) ──
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading]  = useState(false);
  const [pName, setPName]     = useState('');
  const [pCategory, setPCategory] = useState('Food');
  const [pPrice, setPPrice]   = useState('');
  const [pStock, setPStock]   = useState('');
  const [pImage, setPImage]   = useState('');
  const [pImageUploading, setPImageUploading] = useState(false);
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError]   = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);

  const isEdit = !!vendor;

  const loadProducts = useCallback(async () => {
    if (!savedVendor?.id) return;
    setProductsLoading(true);
    try {
      const res = await authFetch(`/products/vendor/${savedVendor.id}`);
      const json = await res.json();
      if (json.success) setProducts(json.data.products ?? json.data);
    } catch {}
    setProductsLoading(false);
  }, [authFetch, savedVendor]);

  useEffect(() => { if (tab === 'products') loadProducts(); }, [tab, loadProducts]);

  async function handleLogoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setLogoError(err); return; }
    setLogoError(null);
    setLogoUploading(true);
    const url = await uploadToCloudinary(file, { folder: 'firstchoice/vendor_logos' });
    setLogoUploading(false);
    if (url) setLogo(url); else setLogoError('Upload failed — please try again.');
  }

  async function saveProfile() {
    if (!businessName.trim() || !address.trim() || !phone.trim()) {
      setError('Business name, address, and phone are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit || savedVendor?.id) {
        const res = await authFetch(`/admin/vendors/${savedVendor.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ businessName, businessType, address, phone, openingHours, logo }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Could not update vendor');
        setSavedVendor(json.data ?? { ...savedVendor, businessName, businessType, address, phone, openingHours, logo });
      } else {
        if (!ownerName.trim() || !ownerPhone.trim()) {
          throw new Error('Owner name and phone are required to create the account.');
        }
        const res = await authFetch('/admin/vendors', {
          method: 'POST',
          body: JSON.stringify({
            businessName, businessType, address, phone, openingHours, logo,
            ownerName, ownerPhone, ownerEmail: ownerEmail || undefined,
            password: tempPassword || undefined,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Could not create vendor');
        setSavedVendor(json.data);
        if (json.tempPassword) setCreatedCreds({ phone: ownerPhone, password: json.tempPassword });
        setTab('products');
      }
      onSaved();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setSaving(false);
  }

  async function handleProductImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setPError(err); return; }
    setPError(null);
    setPImageUploading(true);
    const url = await uploadToCloudinary(file, { folder: 'firstchoice/products' });
    setPImageUploading(false);
    if (url) setPImage(url); else setPError('Image upload failed — please try again.');
  }

  async function addProduct() {
    if (!pName.trim() || !pPrice || !savedVendor?.id) return;
    setPSaving(true);
    setPError(null);
    try {
      const res = await authFetch(`/admin/vendors/${savedVendor.id}/products`, {
        method: 'POST',
        body: JSON.stringify({
          name: pName.trim(),
          category: pCategory,
          price: parseFloat(pPrice) || 0,
          stock: parseInt(pStock, 10) || 0,
          images: pImage ? [pImage] : [],
          available: true,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not add product');
      setProducts((prev) => [json.data, ...prev]);
      setPName(''); setPPrice(''); setPStock(''); setPImage('');
    } catch (e) {
      setPError(e.message || 'Could not add product.');
    }
    setPSaving(false);
  }

  async function deleteProduct(productId) {
  try {
    await authFetch(`/admin/products/${productId}`, { method: 'DELETE' }); // was /products/${productId}
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  } catch {}
}

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0f1117' }}>{isEdit ? 'Manage Vendor' : 'Add New Vendor'}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{isEdit ? vendor.businessName : 'Create a vendor profile and owner account'}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 22px 0' }}>
          <button onClick={() => setTab('profile')} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, background: tab === 'profile' ? '#fff' : 'transparent',
            color: tab === 'profile' ? theme.green : '#9ca3af', borderBottom: tab === 'profile' ? `2px solid ${theme.green}` : '2px solid transparent',
          }}>Profile</button>
          <button
            onClick={() => savedVendor?.id && setTab('products')}
            disabled={!savedVendor?.id}
            title={!savedVendor?.id ? 'Save the profile first' : undefined}
            style={{
              padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', fontFamily: 'inherit',
              cursor: savedVendor?.id ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700,
              background: tab === 'products' ? '#fff' : 'transparent',
              color: !savedVendor?.id ? '#d1d5db' : tab === 'products' ? theme.green : '#9ca3af',
              borderBottom: tab === 'products' ? `2px solid ${theme.green}` : '2px solid transparent',
            }}
          >Products {savedVendor?.id && products.length > 0 ? `(${products.length})` : ''}</button>
        </div>

        {createdCreds && (
            <div style={{ margin: '12px 22px 0', padding: '10px 14px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
              Owner login — phone: <strong>{createdCreds.phone}</strong>, password: <strong>{createdCreds.password}</strong>. This won't be shown again.
            </div>
          )}

        <div style={{ overflowY: 'auto', padding: 22 }}>
          {tab === 'profile' ? (
            <>
              {/* logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <input id="vendor-logo-input" type="file" accept="image/*" onChange={handleLogoPick} style={{ display: 'none' }} />
                <label htmlFor="vendor-logo-input" style={{
                  width: 72, height: 72, borderRadius: 14, flexShrink: 0, cursor: 'pointer', position: 'relative',
                  background: logo ? `url(${logo}) center/cover` : '#f3f4f6', border: '1.5px dashed #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!logo && !logoUploading && <ImagePlus size={22} color="#9ca3af" />}
                  {logoUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                </label>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Store logo</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Tap the box to upload — square image works best</div>
                  {logoError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{logoError}</div>}
                </div>
              </div>

              <FormField label="Business Name *">
                <input style={fieldStyle} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Akosua Kitchen" />
              </FormField>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <FormField label="Business Type">
                    <select style={fieldStyle} value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                      {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_CATEGORY_EMOJI[t]} {t}</option>)}
                    </select>
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="Phone *">
                    <input style={fieldStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" />
                  </FormField>
                </div>
              </div>

              <FormField label="Address *">
                <input style={fieldStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Market Street, Agona Nkwanta" />
              </FormField>

              <FormField label="Opening Hours">
                <input style={fieldStyle} value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="Mon–Fri: 8am–8pm" />
              </FormField>

              {!isEdit && (
                <>
                  <div style={{ height: 1, background: '#f0f0f0', margin: '18px 0' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1117', marginBottom: 4 }}>Owner Account</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>This creates the login the vendor will use.</div>

                  <FormField label="Owner Name *">
                    <input style={fieldStyle} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Full name" />
                  </FormField>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <FormField label="Owner Phone *">
                        <input style={fieldStyle} value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="0241234567" />
                      </FormField>
                    </div>
                    <div style={{ flex: 1 }}>
                      <FormField label="Owner Email">
                        <input style={fieldStyle} value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="optional" />
                      </FormField>
                    </div>
                  </div>
                  <FormField label="Temporary Password">
                    <input style={fieldStyle} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Leave blank to auto-generate" />
                  </FormField>
                </>
              )}

              {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}

              <button onClick={saveProfile} disabled={saving || logoUploading} style={{
                width: '100%', height: 44, border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
                background: theme.green, color: '#fff', cursor: saving ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving || logoUploading ? 0.7 : 1,
              }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : isEdit ? 'Save Changes' : 'Create Vendor'}
              </button>
            </>
          ) : (
            <>
              {/* ── quick product add ── */}
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, marginBottom: 18, background: '#f9fafb' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1117', marginBottom: 12 }}>Add a product</div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <input id="admin-product-image" type="file" accept="image/*" onChange={handleProductImagePick} style={{ display: 'none' }} />
                  <label htmlFor="admin-product-image" style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0, cursor: 'pointer', position: 'relative',
                    background: pImage ? `url(${pImage}) center/cover` : '#fff', border: '1.5px dashed #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!pImage && !pImageUploading && <ImagePlus size={18} color="#9ca3af" />}
                    {pImageUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </label>
                  <input style={{ ...fieldStyle, flex: 1 }} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name" />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <select style={{ ...fieldStyle, flex: 1 }} value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
                    {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_CATEGORY_EMOJI[t]} {t}</option>)}
                  </select>
                  <input style={{ ...fieldStyle, width: 100 }} value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="GHS" inputMode="decimal" />
                  <input style={{ ...fieldStyle, width: 90 }} value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="Stock" inputMode="numeric" />
                </div>

                {pError && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{pError}</div>}

                <button onClick={addProduct} disabled={!pName.trim() || !pPrice || pSaving} style={{
                  height: 38, padding: '0 18px', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  background: pName.trim() && pPrice ? theme.green : '#d1d5db', color: '#fff',
                  cursor: pName.trim() && pPrice ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {pSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />} Add Product
                </button>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                  Basic fields only — the vendor can add variants, add-ons, and extra details from their own app.
                </div>
              </div>

              {/* ── existing products ── */}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1117', marginBottom: 10 }}>Existing products</div>
              {productsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af', fontSize: 13 }}>No products yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid #f0f0f0', borderRadius: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : '#f3f4f6',
                      }}>{!p.images?.[0] && (PRODUCT_CATEGORY_EMOJI[p.category] || '📦')}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>GHS {Number(p.price ?? 0).toFixed(2)} · {p.stock ?? 0} in stock</div>
                      </div>
                      <button onClick={() => deleteProduct(p.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SECTION COMPONENTS
═══════════════════════════════════════════════ */

/* ── OVERVIEW ── */
function Overview({ authFetch }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes, rRes] = await Promise.all([
        authFetch('/admin/stats'),
        authFetch('/admin/analytics/orders'),
        authFetch('/admin/analytics/riders'),
      ]);
      const [s, o, r] = await Promise.all([sRes.json(), oRes.json(), rRes.json()]);
      setStats({ summary: s.data, orders: o.data, riders: r.data });
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const s = stats?.summary;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Dashboard Overview</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Real-time platform metrics</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* STAT GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        <StatCard loading={loading} icon={<Users size={20}/>}       label="Total Users"      value={s?.users?.total}              color="#3b82f6"/>
        <StatCard loading={loading} icon={<Bike size={20}/>}        label="Active Riders"    value={`${s?.riders?.active??0}/${s?.riders?.total??0}`} color="#f59e0b" sub="Online / Total"/>
        <StatCard loading={loading} icon={<Store size={20}/>}       label="Vendors"          value={s?.vendors?.total}            color="#10b981"/>
        <StatCard loading={loading} icon={<ShoppingBag size={20}/>} label="Orders Today"     value={s?.orders?.today}             color="#8b5cf6" sub={`${s?.orders?.pending??0} pending`}/>
        <StatCard loading={loading} icon={<Truck size={20}/>}       label="Deliveries Today" value={s?.deliveries?.today}         color="#06b6d4"/>
        <StatCard loading={loading} icon={<TrendingUp size={20}/>}  label="Revenue Today"    value={s?.revenue?.today ? `GHS ${s.revenue.today.toFixed(2)}` : 'GHS 0'} color="#ec4899"/>
      </div>

      {/* ORDER STATUS BREAKDOWN */}
      {stats?.orders?.byStatus && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'20px 24px', marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 16px' }}>Orders by Status</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {stats.orders.byStatus.map(b => (
              <div key={b.orderStatus} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                <StatusBadge status={b.orderStatus}/>
                <span style={{ fontWeight:800, color:'#0f1117' }}>{b._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP VENDORS */}
      {stats?.orders?.topVendors?.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'20px 24px' }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 16px' }}>Top Vendors</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.orders.topVendors.map((v,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:'#f9fafb' }}>
                <span style={{ width:28, height:28, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#374151' }}>{i+1}</span>
                <span style={{ fontWeight:700, color:'#0f1117', flex:1 }}>{v.vendor?.businessName || 'Unknown'}</span>
                <span style={{ fontSize:13, color:'#6b7280' }}>{v._count.id} orders</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>GHS {(v._sum.totalAmount||0).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── USERS ── */
function UsersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async (p = page, s = search, r = role) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{search:s}), ...(r&&{role:r}) });
      const res = await authFetch(`/admin/users?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.users); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, page, search, role]);

  useEffect(() => { load(1, search, role); }, [search, role]);

  async function toggleStatus(userId, currentStatus) {
    setActing(userId);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await authFetch(`/admin/users/${userId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(page);
    } catch {}
    setActing(null);
  }

  const columns = [
    { key:'name',   label:'Name',   render: r => <div><div style={{ fontWeight:700, color:'#0f1117' }}>{r.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.phone}</div></div> },
    { key:'email',  label:'Email',  render: r => <span style={{ color:'#6b7280' }}>{r.email || '—'}</span> },
    { key:'role',   label:'Role',   render: r => <StatusBadge status={r.role}/> },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status}/> },
    { key:'createdAt', label:'Joined', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key:'actions', label:'', render: r => (
      <button onClick={() => toggleStatus(r.id, r.status)} disabled={acting === r.id}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:`1px solid ${r.status==='ACTIVE'?'#fecaca':'#bbf7d0'}`, background: r.status==='ACTIVE'?'#fef2f2':'#f0fdf4', cursor:'pointer', fontSize:12, fontWeight:700, color: r.status==='ACTIVE'?'#dc2626':'#16a34a' }}>
        {acting===r.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : r.status==='ACTIVE' ? <UserX size={12}/> : <UserCheck size={12}/>}
        {r.status==='ACTIVE' ? 'Suspend' : 'Activate'}
      </button>
    )},
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Users</h2>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', height:38, paddingLeft:36, paddingRight:12, border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e => e.target.style.borderColor = theme.green} onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
        </div>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Roles</option>
          {['CUSTOMER','VENDOR','RIDER','ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No users found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

/* ── VENDORS ── */
function VendorsSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');
  const [acting,  setActing]  = useState(null);

  // null = closed, 'new' = create modal, {..vendor} = manage modal
  const [modalTarget, setModalTarget] = useState(null);

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/admin/vendors?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.vendors); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  async function updateStatus(vendorId, newStatus) {
    setActing(vendorId);
    try {
      await authFetch(`/admin/vendors/${vendorId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(page);
    } catch {}
    setActing(null);
  }

  const columns = [
    { key:'businessName', label:'Business', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
          background: r.logo ? `url(${r.logo}) center/cover` : '#f3f4f6',
        }}>{!r.logo && (PRODUCT_CATEGORY_EMOJI[r.businessType] || '🏪')}</div>
        <div>
          <div style={{ fontWeight:700, color:'#0f1117' }}>{r.businessName}</div>
          <div style={{ color:'#9ca3af', fontSize:12 }}>{r.businessType}</div>
        </div>
      </div>
    )},
    { key:'owner', label:'Owner', render: r => <div><div style={{ fontWeight:600 }}>{r.user?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.user?.phone}</div></div> },
    { key:'products', label:'Products', render: r => <span style={{ fontWeight:700 }}>{r._count?.products ?? 0}</span> },
    { key:'orders',   label:'Orders',   render: r => <span style={{ fontWeight:700 }}>{r._count?.orders ?? 0}</span> },
    { key:'status',   label:'Status',   render: r => <StatusBadge status={r.status}/> },
    { key:'actions',  label:'',         render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={() => setModalTarget(r)}
          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
          <Settings size={11}/> Manage
        </button>
        {r.status !== 'ACTIVE' && (
          <button onClick={() => updateStatus(r.id, 'ACTIVE')} disabled={acting===r.id}
            style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', fontSize:11, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
            {acting===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={11}/>} Approve
          </button>
        )}
        {r.status === 'ACTIVE' && (
          <button onClick={() => updateStatus(r.id, 'INACTIVE')} disabled={acting===r.id}
            style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', fontSize:11, fontWeight:700, color:'#dc2626', display:'flex', alignItems:'center', gap:4 }}>
            {acting===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <XCircle size={11}/>} Deactivate
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Vendors</h2>
        <button onClick={() => setModalTarget('new')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none',
          background: theme.green, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit',
        }}>
          <Plus size={15}/> Add Vendor
        </button>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACTIVE','INACTIVE'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No vendors found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>

      {modalTarget && (
        <VendorFormModal
          vendor={modalTarget === 'new' ? null : modalTarget}
          authFetch={authFetch}
          theme={theme}
          onClose={() => setModalTarget(null)}
          onSaved={() => load(page)}
        />
      )}
    </div>
  );
}

/* ── RIDERS ── */
function RidersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [avail,   setAvail]   = useState('');
  const [viewRiderId, setViewRiderId] = useState(null);

  const load = useCallback(async (p=1, a=avail) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(a&&{availability:a}) });
      const res = await authFetch(`/admin/riders?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.riders); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, avail]);

  useEffect(() => { load(1, avail); }, [avail]);

  const columns = [
    { key:'rider', label:'Rider', render: r => <div><div style={{ fontWeight:700, color:'#0f1117' }}>{r.user?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.user?.phone}</div></div> },
    { key:'bikeType',        label:'Bike',        render: r => r.bikeType },
    { key:'availability',    label:'Status',      render: r => <StatusBadge status={r.availability}/> },
    { key:'totalDeliveries', label:'Deliveries',  render: r => <span style={{ fontWeight:700 }}>{r.totalDeliveries}</span> },
    { key:'rating',          label:'Rating',      render: r => <span style={{ fontWeight:700 }}>⭐ {r.rating?.toFixed(1) || '0.0'}</span> },
    { key:'earnings',        label:'Earnings',    render: r => <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.earnings?.toFixed(2) || '0.00'}</span> },
    { key:'location',        label:'Location',    render: r => r.currentLatitude ? <span style={{ fontSize:12, color:'#3b82f6' }}>📍 {r.currentLatitude.toFixed(3)}, {r.currentLongitude.toFixed(3)}</span> : <span style={{ color:'#9ca3af', fontSize:12 }}>No location</span> },
    { key:'actions', label:'', render: r => (
      <button onClick={() => setViewRiderId(r.id)}
        style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
        <Eye size={11}/> Insights
      </button>
    )},
  ];

  // ── Early return: drill into the detail view, don't render the list ──
  if (viewRiderId) {
    return <RiderInsights riderId={viewRiderId} authFetch={authFetch} theme={theme} onBack={() => setViewRiderId(null)} />;
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Riders</h2>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={avail} onChange={e => setAvail(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All</option>
          {['ONLINE','OFFLINE','BUSY'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No riders found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

/* ── ORDERS ── */
function OrdersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');

  /* Available riders for assignment */
  const [riders,  setRiders]  = useState([]);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/orders?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.orders); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  useEffect(() => {
    authFetch('/riders/available').then(r => r.json()).then(j => {
      if (j.success) setRiders(j.data);
    }).catch(() => {});
  }, [authFetch]);

  async function assignRider(orderId) {
    const riderId = selectedRider[orderId];
    if (!riderId) return;
    setAssigning(orderId);
    try {
      await authFetch(`/admin/orders/${orderId}/assign`, { method:'PATCH', body: JSON.stringify({ riderId }) });
      load(page);
    } catch {}
    setAssigning(null);
  }

  const columns = [
    { key:'id',     label:'Order ID',  render: r => <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</span> },
    { key:'customer', label:'Customer', render: r => <div><div style={{ fontWeight:700 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'vendor',   label:'Vendor',   render: r => <span style={{ fontWeight:600 }}>{r.vendor?.businessName}</span> },
    { key:'amount',   label:'Amount',   render: r => <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.totalAmount?.toFixed(2)}</span> },
    { key:'status',   label:'Status',   render: r => <StatusBadge status={r.orderStatus}/> },
    { key:'rider',    label:'Rider',    render: r => r.rider ? <span style={{ color:'#3b82f6', fontWeight:600 }}>{r.rider.user?.name}</span> : <span style={{ color:'#9ca3af' }}>Unassigned</span> },
    { key:'date',     label:'Date',     render: r => new Date(r.createdAt).toLocaleString() },
    { key:'assign',   label:'Assign',   render: r => r.orderStatus === 'READY_FOR_PICKUP' ? (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <select value={selectedRider[r.id]||''} onChange={e => setSelectedRider(p => ({...p,[r.id]:e.target.value}))}
          style={{ height:30, padding:'0 8px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, outline:'none', background:'#fff', maxWidth:130 }}>
          <option value="">Select rider</option>
          {riders.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
        </select>
        <button onClick={() => assignRider(r.id)} disabled={!selectedRider[r.id] || assigning===r.id}
          style={{ padding:'5px 10px', borderRadius:6, border:'none', background: theme.green, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, opacity: !selectedRider[r.id]?0.5:1 }}>
          {assigning===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : null} Go
        </button>
      </div>
    ) : null },
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Orders</h2>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No orders found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

/* ── DELIVERIES ── */
function DeliveriesSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');
  const [riders,  setRiders]  = useState([]);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/deliveries?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.deliveries); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  useEffect(() => {
    authFetch('/riders/available').then(r => r.json()).then(j => {
      if (j.success) setRiders(j.data);
    }).catch(() => {});
  }, [authFetch]);

  async function assignRider(deliveryId) {
    const riderId = selectedRider[deliveryId];
    if (!riderId) return;
    setAssigning(deliveryId);
    try {
      await authFetch(`/deliveries/${deliveryId}/assign`, { method:'PATCH', body: JSON.stringify({ riderId }) });
      load(page);
    } catch {}
    setAssigning(null);
  }

  const columns = [
    { key:'id',          label:'ID',          render: r => <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</span> },
    { key:'type', label:'Type', render: r => <StatusBadge status={r.type || 'PICKUP'}/> },
    { key:'customer',    label:'Customer',    render: r => <div><div style={{ fontWeight:700 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'pickup',      label:'Pickup',      render: r => <span style={{ fontSize:12 }}>{r.pickupAddress}</span> },
    { key:'destination', label:'Destination', render: r => <span style={{ fontSize:12 }}>{r.destinationAddress}</span> },
    { key:'fee', label:'Fee', render: r => (
  <div>
    <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.estimatedFee}</span>
    {r.type === 'ERRAND' && r.itemsEstimatedTotal > 0 && (
      <div style={{ fontSize:11, color:'#9ca3af' }}>+ GHS {Number(r.itemsEstimatedTotal).toFixed(2)} items</div>
    )}
  </div>
) },
    { key:'status',      label:'Status',      render: r => <StatusBadge status={r.status}/> },
    { key:'rider',       label:'Rider',       render: r => r.rider ? <span style={{ color:'#3b82f6', fontWeight:600 }}>{r.rider.user?.name}</span> : <span style={{ color:'#9ca3af' }}>Unassigned</span> },
    { key:'assign',      label:'Assign',      render: r => r.status === 'PENDING' && !r.assignedRiderId ? (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <select value={selectedRider[r.id]||''} onChange={e => setSelectedRider(p => ({...p,[r.id]:e.target.value}))}
          style={{ height:30, padding:'0 8px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, outline:'none', background:'#fff', maxWidth:130 }}>
          <option value="">Select rider</option>
          {riders.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
        </select>
        <button onClick={() => assignRider(r.id)} disabled={!selectedRider[r.id] || assigning===r.id}
          style={{ padding:'5px 10px', borderRadius:6, border:'none', background: theme.green, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, opacity: !selectedRider[r.id]?0.5:1 }}>
          {assigning===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : null} Assign
        </button>
      </div>
    ) : null },
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Deliveries</h2>
      </div>
      <div style={{ marginBottom:16 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACCEPTED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No deliveries found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

function SettingsSection({ authFetch, theme }) {
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

function PricingModeCard({ active, onClick, title, desc, theme }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex:1, textAlign:'left', padding:14, borderRadius:12, cursor:'pointer', fontFamily:'inherit',
      border: `1.5px solid ${active ? theme.green : '#e5e7eb'}`,
      background: active ? `${theme.green}0f` : '#f9fafb',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${active?theme.green:'#d1d5db'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {active && <div style={{ width:8, height:8, borderRadius:'50%', background:theme.green }}/>}
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'#0f1117' }}>{title}</span>
      </div>
      <div style={{ fontSize:11, color:'#9ca3af', paddingLeft:24 }}>{desc}</div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id:'overview',    label:'Overview',    icon:<LayoutDashboard size={18}/> },
  { id:'orders',      label:'Orders',      icon:<ShoppingBag size={18}/> },
  { id:'deliveries',  label:'Deliveries',  icon:<Truck size={18}/> },
  { id:'vendors',     label:'Vendors',     icon:<Store size={18}/> },
  { id:'riders',      label:'Riders',      icon:<Bike size={18}/> },
  { id:'users',       label:'Users',       icon:<Users size={18}/> },
  { id:'settings', label:'Settings', icon:<Settings size={18}/> },
  { id:'broadcast', label:'Broadcast', icon:<Megaphone size={18}/> },
];

export default function AdminDashboard() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [section, setSection]   = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);

  /* Redirect if not admin */
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
    </div>
  );

  if (!user) return null;

  const SECTIONS = {
    overview:   <Overview    authFetch={authFetch} theme={theme}/>,
    users:      <UsersSection authFetch={authFetch} theme={theme}/>,
    vendors:    <VendorsSection authFetch={authFetch} theme={theme}/>,
    riders:     <RidersSection authFetch={authFetch} theme={theme}/>,
    orders:     <OrdersSection authFetch={authFetch} theme={theme}/>,
    deliveries: <DeliveriesSection authFetch={authFetch} theme={theme}/>,
    settings: <SettingsSection authFetch={authFetch} theme={theme}/>,
    broadcast: <BroadcastSection authFetch={authFetch} theme={theme}/>,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8faf8', fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideOpen ? 240 : 64,
        background:'#fff',
        borderRight:'1px solid #f0f0f0',
        display:'flex',
        flexDirection:'column',
        transition:'width 0.25s ease',
        overflow:'hidden',
        flexShrink:0,
        position:'sticky',
        top:0,
        height:'100vh',
        zIndex:100,
      }}>
        {/* LOGO */}
        <div style={{ padding: sideOpen ? '24px 20px 20px' : '24px 12px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent: sideOpen?'space-between':'center' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15 }}>F</div>
              <div>
                <div style={{ fontWeight:900, fontSize:14, color:'#0f1117', letterSpacing:'-0.3px' }}>FirstChoice</div>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>Admin Panel</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>
            {sideOpen ? <ChevronLeft size={16}/> : <Menu size={16}/>}
          </button>
        </div>

        {/* NAV */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={!sideOpen ? item.label : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding: sideOpen ? '10px 14px' : '10px 0',
                  justifyContent: sideOpen ? 'flex-start' : 'center',
                  borderRadius:10, border:'none', cursor:'pointer',
                  background: active ? `${theme.green}15` : 'transparent',
                  color: active ? theme.green : '#6b7280',
                  fontWeight: active ? 700 : 600,
                  fontSize:14, transition:'all 0.15s', width:'100%',
                  fontFamily:'inherit',
                }}>
                <span style={{ color: active ? theme.green : '#9ca3af', flexShrink:0 }}>{item.icon}</span>
                {sideOpen && item.label}
              </button>
            );
          })}
        </nav>

        {/* USER */}
        <div style={{ padding: sideOpen ? '16px 14px' : '16px 8px', borderTop:'1px solid #f0f0f0' }}>
          {sideOpen ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`${theme.green}20`, display:'flex', alignItems:'center', justifyContent:'center', color: theme.green, fontWeight:900, fontSize:14, flexShrink:0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0f1117', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Administrator</div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, display:'flex', alignItems:'center' }}>
                <LogOut size={15}/>
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px 0' }}>
              <LogOut size={16}/>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, padding:'32px 28px', overflowY:'auto', minWidth:0 }}>
        {SECTIONS[section]}
      </main>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width: 640px) { main { padding: 20px 16px !important; } }
      `}</style>
    </div>
  );
}