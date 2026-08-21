import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'fd.cart';

/**
 * Shopping cart kept in localStorage.
 *
 * A cart may only contain items from a single restaurant, which mirrors the
 * server-side rule that every order belongs to exactly one restaurant.
 */
export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { restaurant: null, items: [] };
    } catch {
      return { restaurant: null, items: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback((restaurant, item, quantity = 1) => {
    setCart((prev) => {
      const differentRestaurant = prev.restaurant && prev.restaurant.id !== restaurant.id;
      const base = differentRestaurant ? { restaurant, items: [] } : { ...prev, restaurant };

      const existing = base.items.find((i) => i.id === item.id);
      const items = existing
        ? base.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i))
        : [...base.items, {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity
          }];

      return { restaurant: base.restaurant, items, replaced: differentRestaurant };
    });
  }, []);

  const setQuantity = useCallback((itemId, quantity) => {
    setCart((prev) => {
      const items = quantity <= 0
        ? prev.items.filter((i) => i.id !== itemId)
        : prev.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
      return { restaurant: items.length ? prev.restaurant : null, items };
    });
  }, []);

  const removeItem = useCallback((itemId) => setQuantity(itemId, 0), [setQuantity]);
  const clear = useCallback(() => setCart({ restaurant: null, items: [] }), []);

  const subtotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart.items]
  );
  const itemCount = useMemo(
    () => cart.items.reduce((sum, i) => sum + i.quantity, 0),
    [cart.items]
  );
  const deliveryFee = cart.restaurant ? Number(cart.restaurant.delivery_fee || 0) : 0;

  const value = useMemo(() => ({
    cart, addItem, setQuantity, removeItem, clear,
    subtotal, deliveryFee, total: subtotal + deliveryFee, itemCount
  }), [cart, addItem, setQuantity, removeItem, clear, subtotal, deliveryFee, itemCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
};
