'use client';

import React, { useState } from 'react';
import { useCart } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/api';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  const { isAuthenticated, user, login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user) {
      login();
      return;
    }

    if (cart.length === 0) return;
    setIsSubmitting(true);
    setOrderError(null);
    setOrderSuccessId(null);

    try {
      const customerId = user.customerId || 1;
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const created = await createOrder(customerId, items);
      setOrderSuccessId(created.id);
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-zinc-900" />
              <h2 className="text-base font-black tracking-tight text-zinc-900">Your Cart</h2>
              <span className="text-[11px] font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {orderSuccessId && (
            <div className="m-4 p-4 rounded-2xl bg-zinc-950 text-white shadow-lg space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Order Confirmed
                </span>
              </div>
              <p className="text-sm font-semibold">
                Order <span className="font-mono">#{orderSuccessId}</span> has been placed successfully.
              </p>
              <Link
                href="/orders"
                onClick={() => {
                  setOrderSuccessId(null);
                  setIsCartOpen(false);
                }}
                className="inline-flex items-center text-xs font-bold text-zinc-300 hover:text-white underline pt-1"
              >
                Track in My Orders <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          )}

          {/* Error Banner */}
          {orderError && (
            <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start">
              <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0 mt-0.5" />
              <div>{orderError}</div>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-24 space-y-2">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-zinc-600 font-bold text-sm">Your cart is empty</p>
                <p className="text-zinc-400 text-xs">Add products from the store to begin checkout.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center space-x-3.5 p-3 rounded-2xl border border-zinc-100 bg-zinc-50/50"
                >
                  <img
                    src={item.product.imgUrl}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-zinc-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs font-mono font-semibold text-zinc-600 mt-0.5">
                      ${item.product.price.toFixed(2)}
                    </p>

                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-zinc-500 hover:text-black transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-zinc-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-zinc-500 hover:text-black transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-zinc-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Ordering Account:</span>
                <span className="font-semibold text-zinc-900">
                  {isAuthenticated && user
                    ? `${user.name} (Customer #${user.customerId})`
                    : 'Not logged in (Sign in to complete)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
                <span>Subtotal:</span>
                <span className="text-lg font-mono font-black text-zinc-950">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              {isAuthenticated ? (
                <button
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 px-4 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:bg-zinc-400"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>Checkout Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={login}
                  className="w-full py-3 px-4 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Keycloak to Checkout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
