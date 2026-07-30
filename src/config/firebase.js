import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});


export async function initPushNotifications(authFetch) {
  try {
    if (!(await isSupported())) return console.warn('[push] messaging not supported in this browser');
    if (!('serviceWorker' in navigator)) return console.warn('[push] no service worker support');

    const permission = await Notification.requestPermission();
    console.log('[push] permission:', permission);
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[push] service worker registered:', registration.scope);

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    console.log('[push] token:', token);
    if (!token) return console.warn('[push] getToken returned empty');

    const res = await authFetch('/users/web-fcm-token', { method: 'PATCH', body: JSON.stringify({ token }) });
    console.log('[push] backend save status:', res.status);

    return token;
  } catch (err) {
    console.error('[push] init failed:', err);
  }
}