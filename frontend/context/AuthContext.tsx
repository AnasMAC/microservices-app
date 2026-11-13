'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import keycloak from '../lib/keycloak';
import { setCookie, deleteCookie } from '../lib/cookies';

export interface AuthUser {
  sub: string;
  username: string;
  name: string;
  email: string;
  roles: string[];
  isAdmin: boolean;
  customerId: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  login: () => void;
  register: () => void;
  logout: () => void;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hashStringToId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100000 + 1;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const parseUserFromToken = useCallback((kc: any): AuthUser => {
    const parsed = kc.tokenParsed || {};
    const roles: string[] = parsed.realm_access?.roles || [];
    const isAdmin = roles.includes('ADMIN');

    let customerId = 1;
    if (parsed.customerId) {
      customerId = Number(parsed.customerId);
    } else if (parsed.sub) {
      customerId = parsed.preferred_username === 'user1' ? 1 : hashStringToId(parsed.sub);
    }

    return {
      sub: parsed.sub || '',
      username: parsed.preferred_username || 'anonymous',
      name: parsed.name || parsed.preferred_username || 'User',
      email: parsed.email || '',
      roles,
      isAdmin,
      customerId,
    };
  }, []);

  let kcInitPromise: Promise<boolean> | null = null;

  useEffect(() => {
    const kc = keycloak;
    if (!kc) {
      setIsLoading(false);
      return;
    }

    if (!kcInitPromise) {
          kcInitPromise = kc.init({
            flow: 'standard',
            checkLoginIframe: false,
          });
        }


    kcInitPromise
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        if (authenticated && kc.token) {
          setToken(kc.token);
          setCookie('kc_token', kc.token, 1);

          const parsed = parseUserFromToken(kc);
          setUser(parsed);

          setInterval(() => {
            kc.updateToken(60)
              .then((refreshed) => {
                if (refreshed && kc.token) {
                  setToken(kc.token);
                  setCookie('kc_token', kc.token, 1);
                }
              })
              .catch(() => {
                console.warn('Token refresh failed');
              });
          }, 30000);
        } else {
          deleteCookie('kc_token');
          setUser(null);
          setToken(null);
        }
      })
      .catch((err) => {
        console.warn('Keycloak initialization check:', err);
        setAuthError('Keycloak currently unreachable');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [parseUserFromToken]);

  const login = () => {
    const kc = keycloak;
    if (!kc) return;
    kc.login({
      redirectUri: typeof window !== 'undefined' ? window.location.origin + '/products' : undefined,
    });
  };

  const register = () => {
    const kc = keycloak;
    if (!kc) return;
    kc.register({
      redirectUri: typeof window !== 'undefined' ? window.location.origin + '/products' : undefined,
    });
  };

  const logout = () => {
    deleteCookie('kc_token');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    const kc = keycloak;
    if (kc) {
      kc.logout({
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/products' : undefined,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        register,
        logout,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
