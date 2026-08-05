'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Mirrors ForgotPasswordScreen in the mobile app: the customer enters
// their phone number, the backend looks up the email on file for that
// account and mails a reset link to it (see resetPasswordEmail() in
// auth.service.ts), and the customer follows that link to /reset-password
// (see ResetPassword.jsx) to actually set a new password. This page only
// handles the "send me a link" step — same as the mobile flow.
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function ForgotPasswordPage() {
  const { theme } = useTheme();

  const [phone, setPhone]   = useState('');
  const [status, setStatus] = useState('ready'); // ready | submitting | sent
  const [error, setError]   = useState('');
  const [sentToEmail, setSentToEmail] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (phone.trim().length < 9) {
      setError('Enter a valid phone number');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      console.log('reset-password-email response:', json);
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not send reset link');
      }
      setSentToEmail(json.data?.email || '');
      setStatus('sent');
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setStatus('ready');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 28 }}
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: `${theme.green}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <MailCheck size={24} color={theme.green} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', marginBottom: 8 }}>Check your email</h1>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
              {sentToEmail
                ? <>We&rsquo;ve sent a password reset link to <strong>{sentToEmail}</strong>.</>
                : "We\u2019ve sent a password reset link to the email on your account."}
              {' '}Follow the link there to set a new password.
            </p>
            <button
              type="button"
              onClick={() => { setStatus('ready'); setPhone(''); setSentToEmail(''); }}
              style={{ marginTop: 20, background: 'none', border: 'none', color: theme.green, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Use a different number
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f1117', letterSpacing: '-0.6px', marginBottom: 8 }}>
              Forgot your password?
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Enter your phone number and we&rsquo;ll send a reset link to the email on your account.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                  padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="tel"
                    placeholder="0241234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: '100%', height: 48, paddingLeft: 42, paddingRight: 16,
                      border: '1.5px solid #e5e7eb', borderRadius: 10,
                      fontSize: 15, color: '#0f1117', background: '#fff',
                      outline: 'none', transition: 'border-color 0.2s',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = theme.green)}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  width: '100%', height: 50, borderRadius: 10, border: 'none',
                  background: status === 'submitting' ? '#9ca3af' : `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                {status === 'submitting'
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                  : <>Send Reset Link <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}