import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onMessage, getToken } from 'firebase/messaging';
// import { getMessagingIfSupported, VAPID_KEY } from '../lib/firebase';
import { getMessagingIfSupported, VAPID_KEY } from '../../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Mount this once near the root of the app (e.g. in App.jsx, inside your
 * auth/router providers). It:
 *  - registers firebase-messaging-sw.js
 *  - asks for notification permission
 *  - gets an FCM token and POSTs it to /users/me/fcm-token, same endpoint
 *    the mobile app's PushNotificationService uses
 *  - shows an in-app toast for pushes that arrive while the tab is open
 *    (the service worker handles it when the tab is backgrounded/closed)
 *  - routes to the right screen when a notification is tapped
 */
export function useNotifications() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [toast, setToast] = useState(null); // { title, body, data } | null
  const tokenSentRef = useRef(false);

  const sendTokenToBackend = useCallback(async (token) => {
    if (!token || tokenSentRef.current) return;
    try {
      await authFetch('/users/me/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform: 'web' }),
      });
      tokenSentRef.current = true;
    } catch {
      // will retry next mount/login — not fatal
    }
  }, [authFetch]);

  const requestPermissionAndRegister = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') return;

    const messaging = await getMessagingIfSupported();
    if (!messaging) return;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    await sendTokenToBackend(token);
  }, [sendTokenToBackend]);

  // Only try once a user is logged in (so the token is tied to their account).
  useEffect(() => {
    if (!user) return;
    requestPermissionAndRegister();
  }, [user, requestPermissionAndRegister]);

  // Foreground pushes (tab open + focused).
  useEffect(() => {
    let unsubscribe;
    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        setToast({
          title: payload.notification?.title || payload.data?.title || 'FirstChoice',
          body: payload.notification?.body || payload.data?.body || '',
          data: payload.data || {},
        });
      });
    })();
    return () => unsubscribe?.();
  }, []);

  // Tap routing when the click happened via the service worker (background).
  useEffect(() => {
    function onSwMessage(event) {
      if (event.data?.type === 'notification-click') {
        const { orderId } = event.data.data || {};
        navigate(orderId ? `/orders/${orderId}` : '/notifications');
      }
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [navigate]);

  function dismissToast() { setToast(null); }

  function openToast() {
    if (toast?.data?.orderId) navigate(`/orders/${toast.data.orderId}`);
    setToast(null);
  }

  return { permission, toast, dismissToast, openToast };
}