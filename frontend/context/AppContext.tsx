'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, UserProfile } from '../lib/types';
import { loginWithKeycloak, setAuthToken } from '../lib/api';

export const DEMO_USERS: UserProfile[] = [
  {
    username: 'user1',
    name: 'Standard Customer (user1)',
    role: 'USER',
    customerId: 1,
  },
  {
    username: 'admin',
    name: 'System Admin (admin)',
    role: 'ADMIN',
    customerId: 0,
  },
];

interface AppContextType {
  activeUser: UserProfile;
  switchUser: (username: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartTotal: number;
  cartCount: number;
  authError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUser] = useState<UserProfile>(DEMO_USERS[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authenticate user against Keycloak on user switch or load
  const switchUser = async (username: string) => {
    const user = DEMO_USERS.find((u) => u.username === username) || DEMO_USERS[0];
    setActiveUser(user);
    setAuthError(null);

    try {
      const password = user.username === 'admin' ? 'admin' : 'password';
      await loginWithKeycloak(user.username, password);
    } catch (err: any) {
      console.warn('Could not acquire Keycloak token, running in local dev mode:', err.message);
      // In dev mode if Keycloak isn't running yet, we keep going so the UI is fully functional
      setAuthError('Keycloak is not connected or offline (dev demo mode active)');
    }
  };

  useEffect(() => {
    switchUser('user1');
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        activeUser,
        switchUser,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartTotal,
        cartCount,
        authError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
