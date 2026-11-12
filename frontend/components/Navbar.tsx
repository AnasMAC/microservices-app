'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp, DEMO_USERS } from '../context/AppContext';
import { ShoppingCart, Package, Users, ShoppingBag, ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { activeUser, switchUser, cartCount, setIsCartOpen, authError } = useApp();

  const navLinks = [
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/customers', label: 'Customers', icon: Users, adminOnly: true },
    { href: '/orders', label: 'Orders', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/products" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                M
              </div>
              <div>
                <span className="font-extrabold text-xl text-gray-900 tracking-tight">MicroStore</span>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 font-semibold uppercase">Cloud</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex ml-8 space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {link.label}
                    {link.adminOnly && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 font-bold uppercase rounded-full bg-amber-100 text-amber-800">
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side controls: Role switch & Cart */}
          <div className="flex items-center space-x-4">
            {/* User switcher */}
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl text-xs font-medium">
              {DEMO_USERS.map((user) => {
                const isSelected = activeUser.username === user.username;
                return (
                  <button
                    key={user.username}
                    onClick={() => switchUser(user.username)}
                    className={`flex items-center px-2.5 py-1.5 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {user.role === 'ADMIN' ? (
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    ) : (
                      <User className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    )}
                    <span>{user.username}</span>
                    <span className="ml-1 text-[10px] text-gray-400">({user.role})</span>
                  </button>
                );
              })}
            </div>

            {/* Cart trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {authError && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-xs text-amber-800 text-center">
          ℹ️ {authError}
        </div>
      )}
    </header>
  );
}
