'use client';
import { useState, useMemo } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProductModal({ product, onClose }) {
  const { addItem } = useCart();
  const { theme } = useTheme();

  const [selectedVariants, setSelectedVariants] = useState({}); // groupId -> variant
  const [addonQty, setAddonQty] = useState({});                 // addonId -> qty
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('');

  const hasVariants = (product.variantGroups?.length ?? 0) > 0;

  const findAddon = (addonId) => {
    for (const g of product.addonGroups || []) {
      const a = g.addons.find((x) => x.id === addonId);
      if (a) return { addon: a, group: g };
    }
    return null;
  };

  const addonTotal = (addon, qty) => {
    const incrementable = addon.incrementable ?? false;
    const mode = addon.incrementMode ?? 'multiple';
    if (incrementable && mode === 'free') return addon.price + (qty - 1);
    return addon.price * qty;
  };

  const addonExtra = useMemo(() => {
    return Object.entries(addonQty).reduce((sum, [id, qty]) => {
      const found = findAddon(id);
      return found ? sum + addonTotal(found.addon, qty) : sum;
    }, 0);
  }, [addonQty]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemPrice = useMemo(() => {
    if (useCustomPrice) return parseFloat(customPrice) || 0;
    if (hasVariants) {
      const requiredGroup = product.variantGroups.find((g) => g.required);
      if (requiredGroup) {
        const sel = selectedVariants[requiredGroup.id];
        return sel ? sel.priceAdjustment : product.price;
      }
    }
    return product.price;
  }, [useCustomPrice, customPrice, hasVariants, selectedVariants, product]);

  const unitPrice = itemPrice + addonExtra;
  const totalPrice = unitPrice * quantity;

  const requiredGroup = product.variantGroups?.find((g) => g.required);
  const showFromPrice = requiredGroup && !selectedVariants[requiredGroup.id] && !useCustomPrice;

  const canAdd = useCustomPrice
    ? parseFloat(customPrice) > 0
    : (product.variantGroups || []).every((g) => !g.required || selectedVariants[g.id]);

  function handleAdd() {
    const selectedAddons = Object.entries(addonQty).map(([id, qty]) => {
      const { addon, group } = findAddon(id);
      return {
        groupId: group.id, groupName: group.name,
        addonId: addon.id, addonName: addon.name,
        price: addonTotal(addon, qty), quantity: qty,
      };
    });

    addItem({
      productId: product.id,
      vendorId: product.vendorId,
      name: product.name,
      price: unitPrice,
      image: product.images?.[0] || null,
      quantity,
      selectedVariants: useCustomPrice ? [] : Object.values(selectedVariants).map((v) => ({
        groupId: v.groupId, groupName: v.groupName, variantId: v.variantId, variantName: v.variantName, priceAdjustment: v.priceAdjustment,
      })),
      selectedAddons,
      itemNotes: notes.trim() || null,
      customPrice: useCustomPrice ? parseFloat(customPrice) : null,
    });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2 }} />
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 20, background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>

        <div style={{ overflowY: 'auto', padding: '8px 20px 0' }}>
          {product.images?.[0] && (
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              {(product.isFeatured || product.isPopular) && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {product.isFeatured && <Tag label="⭐ Featured" color="#f59e0b" bg="#fef3c7" />}
                  {product.isPopular && <Tag label="🔥 Popular" color="#dc2626" bg="#fee2e2" />}
                </div>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f1117', margin: 0 }}>{product.name}</h2>
            </div>
            <PriceDisplay showFromPrice={showFromPrice} unitPrice={unitPrice} addonExtra={addonExtra} basePrice={product.price} useCustomPrice={useCustomPrice} />
          </div>

          {product.description && <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginTop: 8 }}>{product.description}</p>}

          {product.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {product.tags.map((t) => <Tag key={t} label={t} color={theme.green} bg={`${theme.green}18`} />)}
            </div>
          )}

          {/* Custom price toggle */}
          <div style={{
            marginTop: 16, borderRadius: 12, padding: 12,
            background: useCustomPrice ? `${theme.green}12` : '#f9fafb',
            border: `1px solid ${useCustomPrice ? theme.green : '#e5e7eb'}`,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <ToggleBtn active={!useCustomPrice} label="Pre Packaged" onClick={() => setUseCustomPrice(false)} theme={theme} />
                <ToggleBtn active={useCustomPrice} label="Customize" onClick={() => setUseCustomPrice(true)} theme={theme} />
            </div>
            {useCustomPrice && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>GHS</span>
                  <input type="number" placeholder="Enter your price" value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    style={{ flex: 1, height: 38, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px', fontFamily: 'inherit' }} />
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Set your own price (minimum GHS {product.price?.toFixed(2)})</p>
              </div>
            )}
          </div>

          {/* Variant groups */}
          {!useCustomPrice && product.variantGroups?.map((group) => (
            <div key={group.id} style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{group.name}</span>
                <Tag label={group.required ? 'Required' : 'Optional'} color={group.required ? '#dc2626' : '#6b7280'} bg={group.required ? '#fee2e2' : '#f3f4f6'} />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 10px' }}>Choose one — this sets your price</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.variants.filter((v) => v.available).map((v) => {
                  const isSelected = selectedVariants[group.id]?.variantId === v.id;
                  return (
                    <button key={v.id} onClick={() => setSelectedVariants((prev) => {
                      if (isSelected && !group.required) { const c = { ...prev }; delete c[group.id]; return c; }
                      return { ...prev, [group.id]: { groupId: group.id, groupName: group.name, variantId: v.id, variantName: v.name, priceAdjustment: v.priceAdjustment } };
                    })} style={{
                      padding: '11px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? theme.green : '#e5e7eb'}`,
                      background: isSelected ? theme.green : '#fff',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : '#0f1117' }}>{v.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.85)' : theme.green }}>GHS {v.priceAdjustment.toFixed(2)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Addon groups */}
          {product.addonGroups?.map((group) => (
            <div key={group.id} style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{group.name}</span>
                <Tag label="Optional" color="#6b7280" bg="#f3f4f6" />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 10px' }}>Added on top of your item price</p>
              {group.addons.filter((a) => a.available).map((addon) => {
                const qty = addonQty[addon.id] || 0;
                const selected = qty > 0;
                return (
                  <div key={addon.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginBottom: 8,
                    borderRadius: 12, border: `${selected ? 1.5 : 1}px solid ${selected ? theme.green : '#e5e7eb'}`,
                    background: selected ? `${theme.green}0f` : '#fff',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1117' }}>{addon.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{addon.price > 0 ? `+GHS ${addon.price.toFixed(2)} each` : 'Free'}</div>
                    </div>
                    {qty === 0 ? (
                      <button onClick={() => setAddonQty((p) => ({ ...p, [addon.id]: 1 }))} style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', background: theme.green, color: '#fff',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      }}>Add</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: theme.green }}>+GHS {addonTotal(addon, qty).toFixed(2)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.green}`, borderRadius: 8 }}>
                          <StepBtn icon={<Minus size={14} />} onClick={() => setAddonQty((p) => ({ ...p, [addon.id]: qty - 1 }))} />
                          <span style={{ padding: '0 10px', fontWeight: 900, color: theme.green }}>{qty}</span>
                          <StepBtn icon={<Plus size={14} />} onClick={() => setAddonQty((p) => ({ ...p, [addon.id]: qty + 1 }))} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Notes */}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Special Instructions (optional)</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="e.g. No pepper, extra sauce, gift wrap..."
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px 20px' }}>
          {!canAdd && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, color: '#d97706', fontSize: 12, fontWeight: 600 }}>
              <Info size={14} /> {useCustomPrice ? 'Please enter a valid price' : 'Select a required option above'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <StepBtn icon={<Minus size={16} />} onClick={() => quantity > 1 && setQuantity(quantity - 1)} pad={10} />
              <span style={{ padding: '0 16px', fontWeight: 900 }}>{quantity}</span>
              <StepBtn icon={<Plus size={16} />} onClick={() => setQuantity(quantity + 1)} pad={10} />
            </div>
            <button disabled={!canAdd} onClick={handleAdd} style={{
              flex: 1, border: 'none', borderRadius: 12, background: canAdd ? theme.green : '#d1d5db',
              color: '#fff', fontWeight: 800, fontSize: 14, cursor: canAdd ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}>
              {canAdd ? `Add to Cart  •  GHS ${totalPrice.toFixed(2)}` : 'Select options first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceDisplay({ showFromPrice, unitPrice, addonExtra, basePrice, useCustomPrice }) {
  if (showFromPrice) {
    return (
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>from GHS {basePrice?.toFixed(2)}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>Select option below</div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>GHS {unitPrice.toFixed(2)}</div>
      {addonExtra > 0 && <div style={{ fontSize: 11, color: '#6b7280' }}>incl. +GHS {addonExtra.toFixed(2)} extras</div>}
    </div>
  );
}

function Tag({ label, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: 50 }}>{label}</span>;
}

function ToggleBtn({ active, label, onClick, theme }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      background: active ? theme.green : 'transparent', color: active ? '#fff' : '#6b7280', fontWeight: 600,
    }}>{label}</button>
  );
}

function StepBtn({ icon, onClick, pad = 8 }) {
  return <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: pad, color: '#10b981', display: 'flex' }}>{icon}</button>;
}