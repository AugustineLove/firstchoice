'use client';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, authFetch, updateUser } = useAuth();
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.profileImage || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!/^(0|\+233)\d{9}$/.test(form.phone.trim())) next.phone = 'Enter a valid Ghanaian number (e.g. 024XXXXXXX)';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
  if (!validate()) return;
  setSaving(true);
  try {
    if (avatarFile) {
      const fd = new FormData();
      fd.append('image', avatarFile);
      const avatarRes = await authFetch('/users/me/avatar', { method: 'POST', body: fd });
      const avatarData = await avatarRes.json();
      if (!avatarData.success) throw new Error(avatarData.message);
    }

    const res = await authFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    updateUser(data.data.user);
    showToast('Profile updated successfully, refresh page');
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    setSaving(false);
  }
}

  function validatePw() {
    const next = {};
    if (!pwForm.currentPassword) next.currentPassword = 'Required';
    if (pwForm.newPassword.length < 6) next.newPassword = 'At least 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setPwErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePasswordSave() {
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwOpen(false);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Edit Profile</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 88, height: 88, borderRadius: '50%', background: `${theme.green}18`, color: theme.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900,
                overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            {/* <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%',
                background: theme.green, border: '2px solid #fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Camera size={14} color="#fff" />
            </button> */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Form fields */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20, marginBottom: 16 }}>
          <Field label="Full Name" value={form.name} error={errors.name} onChange={(v) => handleChange('name', v)} />
          <Field label="Email" type="email" value={form.email} error={errors.email} onChange={(v) => handleChange('email', v)} />
          <Field label="Phone Number" value={form.phone} error={errors.phone} onChange={(v) => handleChange('phone', v)} last />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: 48, borderRadius: 12, border: 'none', background: theme.green, color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, marginBottom: 16,
          }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Password section */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div
            onClick={() => setPwOpen((o) => !o)}
            style={{ padding: '15px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}
          >
            Change Password
            <span style={{ color: '#9ca3af' }}>{pwOpen ? '−' : '+'}</span>
          </div>
          {pwOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <PasswordField
                label="Current Password"
                value={pwForm.currentPassword}
                error={pwErrors.currentPassword}
                show={showPw.current}
                onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))}
              />
              <PasswordField
                label="New Password"
                value={pwForm.newPassword}
                error={pwErrors.newPassword}
                show={showPw.next}
                onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))}
              />
              <PasswordField
                label="Confirm New Password"
                value={pwForm.confirmPassword}
                error={pwErrors.confirmPassword}
                show={showPw.confirm}
                onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))}
                last
              />
              <button
                onClick={handlePasswordSave}
                disabled={pwSaving}
                style={{
                  width: '100%', height: 42, borderRadius: 10, border: `1px solid ${theme.green}`, background: '#fff',
                  color: theme.green, fontWeight: 700, fontSize: 13, cursor: pwSaving ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'error' ? '#dc2626' : '#0f1117', color: '#fff',
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 50,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, error, type = 'text', last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', height: 44, borderRadius: 10, border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
          padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }}
      />
      {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function PasswordField({ label, value, onChange, error, show, onToggle, last }) {
  return (
    <div style={{ marginBottom: last ? 12 : 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', height: 44, borderRadius: 10, border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
            padding: '0 40px 0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          {show ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  );
}