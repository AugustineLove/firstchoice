'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

/*
  Web equivalent of core/network/socket_service.dart.
  Same backend socket, same auth handshake ({ auth: { token } }), same
  reconnection behavior. Exposes a toast queue so any page can react to
  order-status pushes without each page managing its own listeners.

  SOCKET_URL should match AppConstants.socketUrl from the Flutter app —
  set it via env so it's easy to point at local/staging/prod.
*/

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://firstchoice-backend.onrender.com';
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth(); 
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const listenersRef = useRef({}); // event -> Set(callback), re-attached on reconnect

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => dismissToast(id), 6000);
  }, [dismissToast]);

  const on = useCallback((event, cb) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = new Set();
    listenersRef.current[event].add(cb);
    socketRef.current?.on(event, cb);
    return () => {
      listenersRef.current[event]?.delete(cb);
      socketRef.current?.off(event, cb);
    };
  }, []);

  const emit = useCallback((event, data) => socketRef.current?.emit(event, data), []);

  useEffect(() => {
    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('reconnect', () => {
      // re-attach any listeners registered before the reconnect
      Object.entries(listenersRef.current).forEach(([event, cbs]) => {
        cbs.forEach((cb) => socket.on(event, cb));
      });
    });

    // Order-status pushes — adjust event name to match your backend emitter
    socket.on('order:status', (data) => {
      pushToast({
        title: `Order ${data.orderId?.slice(-8)?.toUpperCase()}`,
        body: (data.status || '').replace(/_/g, ' '),
        orderId: data.orderId,
      });
    });

    // Delivery-status pushes (parcel/errand tracking)
    socket.on('delivery:status', (data) => {
      pushToast({
        title: 'Delivery update',
        body: (data.status || '').replace(/_/g, ' '),
        deliveryId: data.deliveryId,
      });
    });

    return () => socket.disconnect();
  }, [user, token, pushToast]);

  return (
    <SocketContext.Provider value={{ connected, on, emit, toasts, dismissToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320,
    }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onDismiss(t.id)} style={{
          background: '#0f1117', color: '#fff', borderRadius: 12,
          padding: '12px 16px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>{t.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'capitalize' }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}