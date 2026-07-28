import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { app } from './src/config/firebase'
// Same config as public/firebase-messaging-sw.js — keep the two in sync.

// Get this from Firebase Console → Project Settings → Cloud Messaging →
// Web configuration → "Web Push certificates". Required to get a token.
export const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(app);

// Messaging isn't supported in every browser (no Safari on older iOS, no
// private/incognito in some cases) — always check before using it.
export async function getMessagingIfSupported() {
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}