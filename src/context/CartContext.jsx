'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/*
  Mirrors mobile's CartNotifier (features/marketplace/presentation/providers/cart_provider.dart):
  - single-vendor cart (adding from a different vendor clears the cart first)
  - persisted locally (localStorage here, SharedPreferences on mobile)
  - same delivery-fee formula: GHS 5 base + GHS 2 per every GHS 50 of subtotal
*/

const STORAGE_KEY = 'fc_cart_items_v1';
const CartContext = createContext(null);

function calcFee(subtotal) {
  return subtotal > 0 ? 5 + Math.floor(subtotal / 50) * 2 : 0;
}

function lineTotal(item) {
  const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + (a.price || 0), 0);
  return (item.price + addonsTotal) * item.quantity;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // corrupted cache shouldn't block the app — start empty
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist on every change, but not before initial load finishes
  // (otherwise an empty initial state would overwrite a saved cart)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const vendorId = items.length ? items[0].vendorId : null;

  const addItem = useCallback((item) => {
    setItems((prev) => {
      if (prev.length && prev[0].vendorId !== item.vendorId) {
        // Different vendor — cart is single-vendor, same as mobile
        return [item];
      }
      const idx = prev.findIndex((i) => i.productId === item.productId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, qty) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  }, [removeItem]);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + lineTotal(i), 0), [items]);
  const deliveryFee = useMemo(() => calcFee(subtotal), [subtotal]);
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const value = {
    items, vendorId, addItem, removeItem, updateQuantity, clear,
    subtotal, deliveryFee, total, totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}