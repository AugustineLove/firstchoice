import { useEffect, useState } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DISMISS_KEY = 'fc_install_prompt_dismissed_at';
const RENAG_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // don't re-nag for 14 days

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < RENAG_AFTER_MS;
}

/**
 * Mount once near the app root. Shows nothing if the app is already
 * installed/running standalone, or if the user dismissed it recently.
 */
export default function InstallPrompt() {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    // iOS never fires beforeinstallprompt — show manual instructions instead,
    // once the page has settled so it doesn't compete with initial load.
    let iosTimer;
    if (isIos()) {
      iosTimer = setTimeout(() => setVisible(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIosSteps(false);
  }

  async function install() {
    if (!deferredPrompt) {
      setShowIosSteps(true); // iOS path — no native prompt available
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 480, margin: '0 auto', zIndex: 999,
      background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0',
      boxShadow: '0 8px 28px rgba(0,0,0,0.14)', padding: 16,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {!showIosSteps ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: `${theme.green}18`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Download size={20} color={theme.green} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Install FirstChoice</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Add it to your home screen for quick, app-like access.</div>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>
            <X size={18} />
          </button>
          <button
            onClick={install}
            style={{
              flexShrink: 0, background: theme.green, color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Install
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Install on iOS</div>
            <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X size={18} />
            </button>
          </div>
          <Step icon={<Share size={16} color={theme.green} />} text="Tap the Share button in Safari's toolbar" />
          <Step icon={<PlusSquare size={16} color={theme.green} />} text='Scroll down and tap "Add to Home Screen"' />
        </div>
      )}
    </div>
  );
}

function Step({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: '#374151' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      {text}
    </div>
  );
}