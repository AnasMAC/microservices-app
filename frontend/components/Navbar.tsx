'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/AppContext';
import {
  ShoppingBag,
  Package,
  Users,
  ShoppingCart,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, login, register, logout, authError } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();

  const navLinks = [
    { href: '/products', label: 'Shop', icon: ShoppingBag },
    { href: '/orders', label: 'Orders', icon: Package },
    ...(user?.isAdmin ? [{ href: '/customers', label: 'Customers', icon: Users, adminOnly: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/products" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-sm tracking-tighter group-hover:bg-zinc-800 transition">
                ▲
              </div>
              <span className="font-extrabold text-lg tracking-tight text-zinc-900">
                MicroStore
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {link.label}
                    {link.adminOnly && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.2 font-black uppercase rounded bg-amber-100 text-amber-900 tracking-wider">
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Keycloak Auth & Cart */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-xl" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs">
                {user.isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                ) : (
                  <User className="w-4 h-4 text-zinc-700" />
                )}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-zinc-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                    {user.isAdmin ? 'ROLE_ADMIN' : `Customer #${user.customerId}`}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="ml-2 p-1 text-zinc-400 hover:text-rose-600 transition"
                  title="Sign Out from Keycloak"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={login}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 rounded-xl transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={register}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-xl shadow-xs transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-xl transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {authError && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-1 text-[11px] text-amber-800 text-center font-mono">
          ℹ️ {authError}
        </div>
      )}
    </header>
  );
}
