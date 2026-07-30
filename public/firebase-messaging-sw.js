/* eslint-disable no-undef */
// This file MUST live at the site root (e.g. public/firebase-messaging-sw.js
// so it builds to /firebase-messaging-sw.js) — Firebase Messaging only looks
// for it there by default.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Same values as your Firebase web app config (public/client-side config,
// safe to ship — the mobile app already uses the equivalent from
// GoogleService-Info.plist / google-services.json for this same project).
firebase.initializeApp({
  apiKey: "AIzaSyBm2Nx3NssXCutWOjvtmh1ULnPsqLBlqfE",
  authDomain: "first-choice-961d0.firebaseapp.com",
  projectId: "first-choice-961d0",
  storageBucket: "first-choice-961d0.firebasestorage.app",
  messagingSenderId: "422146284663",
  appId: "1:422146284663:web:fc579c653e9c3b6c36fa72",
});

const messaging = firebase.messaging();

// Fires when a push arrives and the site isn't in the foreground —
// mirrors the mobile app's _handleBackgroundMessage.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'FirstChoice';
  const body = payload.notification?.body || payload.data?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: payload.data || {},
    tag: payload.data?.orderId || undefined, // collapse repeats for the same order
  });
});

// Fires when the user clicks the notification — mirrors the mobile app's
// onNotificationTap(orderId, vendorId) callback.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetPath = data.orderId ? `/orders/${data.orderId}` : '/notifications';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'notification-click', data });
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});