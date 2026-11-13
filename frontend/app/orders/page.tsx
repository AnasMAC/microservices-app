'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../lib/types';
import { getOrders, advanceOrderStatus, cancelOrder } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/AppContext';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  LogIn,
  AlertCircle,
  User,
} from 'lucide-react';

export default function OrdersPage() {
  const { isAuthenticated, user, login } = useAuth();
  const { setIsCartOpen } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchOrdersList = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setActionError(null);

    try {
      const res = await getOrders();
      setOrders(res.content || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch orders from Order Service');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, [isAuthenticated, user]);

  const handleAdvanceStatus = async (orderId: number) => {
    setActionLoadingId(orderId);
    setActionError(null);
    try {
      await advanceOrderStatus(orderId);
      await fetchOrdersList();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update order state');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setActionLoadingId(orderId);
    setActionError(null);
    try {
      await cancelOrder(orderId);
      await fetchOrdersList();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Created
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Delivered
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Canceled
          </span>
        );
    }
  };

  // If unauthenticated, prompt to sign in
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-8 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Orders & History</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Please sign in with Keycloak to view and track your orders.
            </p>
          </div>
          <button
            onClick={login}
            className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Keycloak</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-zinc-600 font-semibold text-xs tracking-wide uppercase">
            <Package className="w-4 h-4" />
            <span>Order Fulfillment Service</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tight mt-1">
            {user?.isAdmin ? 'All Orders Management' : 'My Orders & History'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {user?.isAdmin
              ? 'Administrator view across all customer orders. Advance status or manage cancellations.'
              : `Viewing orders placed by ${user?.name} (Customer #${user?.customerId || 1}).`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrdersList}
            className="p-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center">
          <AlertCircle className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center">
          <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No orders found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {user?.isAdmin
              ? 'No customer has placed an order yet in the database.'
              : 'You have not placed any orders yet. Click "New Order" to select products and checkout.'}
          </p>
          <button
            onClick={() => setIsCartOpen(true)}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <span>Open Shop Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalAmount =
              order.productItems?.reduce((sum, item) => sum + item.price, 0) || 0;

            const isProcessing = actionLoadingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-xs hover:shadow-md transition p-6 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-zinc-900 text-sm">
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-[11px] text-zinc-400">
                      {new Date(order.orderDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold">
                      <User className="w-3 h-3 text-zinc-500" />
                      <span>Customer #{order.customerId}</span>
                    </div>

                    <span className="text-sm font-mono font-black text-zinc-950">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.productItems?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center space-x-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100"
                    >
                      <img
                        src={
                          item.product?.imgUrl ||
                          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80'
                        }
                        alt={item.product?.name || 'Product'}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {item.product?.name || `Product #${item.productId}`}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Qty: {item.quantity} × ${(item.price / (item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-zinc-800 text-right">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-50">
                  {/* Admin status advancer */}
                  {user?.isAdmin &&
                    order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELED' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAdvanceStatus(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>
                          Advance to{' '}
                          {order.orderStatus === 'CREATED' ? 'PENDING' : 'DELIVERED'}
                        </span>
                      </button>
                    )}

                  {/* Cancel button */}
                  {order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELED' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
