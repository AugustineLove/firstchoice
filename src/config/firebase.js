import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export async function initPushNotifications(authFetch) {
  if (!(await isSupported()) || !('serviceWorker' in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await authFetch('/users/web-fcm-token', { method: 'PATCH', body: JSON.stringify({ token }) });
  }

  // Fires while the tab is open and focused — your existing SocketProvider
  // toast already covers this case, so this is optional/redundant with it
  onMessage(messaging, () => {});

  return token;
}