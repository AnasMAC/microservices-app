'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createOrder } from '../lib/api';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, clearCart, cartTotal, activeUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(activeUser.customerId || 1);

  if (!isCartOpen) return null;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setOrderError(null);
    setOrderSuccessId(null);

    try {
      const customerId = activeUser.role === 'ADMIN' ? selectedCustomerId : (activeUser.customerId || 1);
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const created = await createOrder(customerId, items);
      setOrderSuccessId(created.id);
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Check gateway connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {cart.length} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {orderSuccessId && (
            <div className="m-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">Order Placed Successfully!</h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    Order <span className="font-mono font-bold">#{orderSuccessId}</span> has been created.
                  </p>
                  <Link
                    href="/orders"
                    onClick={() => {
                      setOrderSuccessId(null);
                      setIsCartOpen(false);
                    }}
                    className="inline-flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-900 mt-2 underline"
                  >
                    View in Orders list <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {orderError && (
            <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start">
              <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error placing order:</span> {orderError}
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">Your shopping cart is empty</p>
                <p className="text-gray-400 text-xs mt-1">Browse products and add items to begin ordering.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center space-x-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <img
                    src={item.product.imgUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0"
                    onError={(e) => {
                      // Fallback image
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">
                      ${item.product.price.toFixed(2)}
                    </p>

                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3">
              {/* Customer ID info */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Ordering as Customer ID:</span>
                {activeUser.role === 'ADMIN' ? (
                  <input
                    type="number"
                    min={1}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-16 px-2 py-0.5 border border-gray-300 rounded text-right font-mono text-xs"
                  />
                ) : (
                  <span className="font-mono font-bold text-gray-900">
                    #{activeUser.customerId || 1} ({activeUser.username})
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-indigo-600">${cartTotal.toFixed(2)}</span>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition flex items-center justify-center space-x-2 text-sm"
              >
                {isSubmitting ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <span>Confirm & Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
