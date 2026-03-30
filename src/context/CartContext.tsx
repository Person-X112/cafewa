'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string; // Added image_url
  quantity?: number;
  category_name?: string;
  options?: {
    milk?: string;
    size?: string;
  };
  note?: string; 
}

interface CartContextType {
  cart: CartItem[]; // Renamed from items
  addItem: (item: CartItem) => void; // Changed parameter type
  removeItem: (key: string) => void; // Changed parameter name
  updateQuantity: (key: string, delta: number) => void; // Changed parameter name and delta
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cafe_cart';

// Helper to generate a unique key for an item based on its ID and options/note
export const getCartKey = (item: CartItem) => {
  const optionsKey = item.options
    ? `${item.options.milk || 'none'}-${item.options.size || 'none'}`
    : 'no-options';
  const noteKey = item.note ? `note-${item.note}` : 'no-note';
  return `${item.id}-${optionsKey}-${noteKey}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, loaded]);

  const addItem = useCallback((item: CartItem) => {
    setCart((prev) => {
      const itemKey = getCartKey(item);
      const existing = prev.find((i) => getCartKey(i) === itemKey);
      if (existing) {
        return prev.map((i) =>
          getCartKey(i) === itemKey ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => getCartKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (getCartKey(i) === key) {
          const newQty = (i.quantity || 1) + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter((i): i is CartItem => i !== null)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
