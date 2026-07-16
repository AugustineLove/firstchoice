import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';


const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState(
    token ? 'ready' : 'invalid'
  );

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    console.log(JSON.stringify(`OobCode: ${oobCode}`));
    if (!oobCode) {
      setStatus('invalid');
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

async function handleSubmit(e) {
  e.preventDefault();

  setFormError('');

  if(password.length < 6){
    setFormError("Password must be at least 6 characters");
    return;
  }

  if(password !== confirm){
    setFormError("Passwords do not match");
    return;
  }

  setStatus("submitting");

  try {

    const res = await fetch(
      `${BACKEND_URL}/auth/reset-password`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          token,
          password
        })
      }
    );


    const data = await res.json();


    if(!res.ok){
      throw new Error(data.message || "Reset failed");
    }


    setStatus("done");


  } catch(error){

    setFormError(error.message);
    setStatus("ready");

  }
}

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Reset your password</h1>

      {status === 'verifying' && <p style={styles.muted}>Verifying your link...</p>}

      {status === 'invalid' && (
        <div style={{ ...styles.msg, ...styles.error }}>
          This link is invalid or has expired. Please request a new one from the app.
        </div>
      )}

      {(status === 'ready' || status === 'submitting') && (
        <form onSubmit={handleSubmit}>
          <p style={styles.muted}>Resetting password</p>
          <input
            type="password"
            placeholder="New password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={styles.input}
          />
          {formError && <div style={{ ...styles.msg, ...styles.error }}>{formError}</div>}
          <button type="submit" disabled={status === 'submitting'} style={styles.button}>
            {status === 'submitting' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {status === 'done' && (
        <div style={{ ...styles.msg, ...styles.success }}>
          Password reset! You can now go back to the app and sign in.
        </div>
      )}

      {status === 'sync-failed' && (
        <div style={{ ...styles.msg, ...styles.error }}>
          Your password was reset, but we couldn't sync it. Please contact support.
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { fontFamily: '-apple-system, sans-serif', maxWidth: 400, margin: '60px auto', padding: '0 20px', color: '#111' },
  title: { fontSize: 20 },
  muted: { color: '#555', fontSize: 14 },
  input: { width: '100%', padding: 12, margin: '8px 0', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' },
  button: { width: '100%', padding: 14, background: '#0a6e4f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, marginTop: 12 },
  msg: { padding: 12, borderRadius: 10, marginTop: 12, fontSize: 14 },
  error: { background: '#fdecea', color: '#b3261e' },
  success: { background: '#e6f4ea', color: '#0a6e4f' },
};