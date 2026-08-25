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
  Pencil,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart,
  Line,
} from 'recharts';
import { BUSINESS_TYPES, fieldStyle, fmtGHS, FormField, PRODUCT_CATEGORY_EMOJI, StatCard, Table } from '../../pages/public/AdminDashboard';
import { AdminProductModal } from './VendorManageModal'; // export this component (see note below)



export function VendorFormModal({ vendor, onClose, onSaved, authFetch, theme }) {
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
 const [editingProduct, setEditingProduct] = useState(null); 

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
    await authFetch(`/admin/products/${productId}`, { method: 'DELETE' });
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
                       <button onClick={() => setEditingProduct(p)} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                        <Pencil size={13} color="#374151" />
                      </button>
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
       {editingProduct && (
        <AdminProductModal
          open={true}
          onClose={() => setEditingProduct(null)}
          editing={editingProduct}
          vendorId={savedVendor.id}
          authFetch={authFetch}
          theme={theme}
          onSave={loadProducts}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}