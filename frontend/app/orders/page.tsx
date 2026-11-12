'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../lib/types';
import { getOrders, advanceOrderStatus, cancelOrder } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';

const FALLBACK_ORDERS: Order[] = [
  {
    id: 101,
    orderDate: new Date().toISOString(),
    orderStatus: 'CREATED',
    customerId: 1,
    productItems: [
      {
        id: 1,
        productId: 1,
        price: 1999.0,
        quantity: 1,
        product: {
          id: 1,
          name: 'MacBook Pro M3',
          price: 1999.0,
          imgUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
        },
      },
    ],
  },
  {
    id: 102,
    orderDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    orderStatus: 'DELIVERED',
    customerId: 1,
    productItems: [
      {
        id: 2,
        productId: 3,
        price: 798.0,
        quantity: 2,
        product: {
          id: 3,
          name: 'Sony WH-1000XM5',
          price: 399.0,
          imgUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        },
      },
    ],
  },
  {
    id: 103,
    orderDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    orderStatus: 'PENDING',
    customerId: 2,
    productItems: [
      {
        id: 3,
        productId: 2,
        price: 1199.0,
        quantity: 1,
        product: {
          id: 2,
          name: 'iPhone 15 Pro',
          price: 1199.0,
          imgUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
        },
      },
    ],
  },
];

export default function OrdersPage() {
  const { activeUser, setIsCartOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchOrdersList = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await getOrders();
      if (res.content && res.content.length > 0) {
        setOrders(res.content);
      } else {
        // Filter fallback orders according to role
        if (activeUser.role === 'ADMIN') {
          setOrders(FALLBACK_ORDERS);
        } else {
          setOrders(FALLBACK_ORDERS.filter((o) => o.customerId === (activeUser.customerId || 1)));
        }
      }
    } catch (err: any) {
      console.warn('Order-service unreachable, showing simulated state:', err);
      if (activeUser.role === 'ADMIN') {
        setOrders(FALLBACK_ORDERS);
      } else {
        setOrders(FALLBACK_ORDERS.filter((o) => o.customerId === (activeUser.customerId || 1)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, [activeUser.role, activeUser.customerId]);

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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Created
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Delivered
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Canceled
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wide uppercase">
            <Package className="w-4 h-4" />
            <span>Order Fulfillment Service</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            {activeUser.role === 'ADMIN' ? 'All Orders Management' : 'My Orders & History'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeUser.role === 'ADMIN'
              ? 'Administrator view across all customers. Advance order lifecycle or process cancellations.'
              : `Viewing orders placed by customer #${activeUser.customerId || 1} (${activeUser.username}).`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrdersList}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center">
          <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold text-base">No orders found</p>
          <p className="text-gray-400 text-xs mt-1">
            {activeUser.role === 'ADMIN'
              ? 'No customer has placed an order yet.'
              : 'You have not placed any orders yet. Click "New Order" to select products.'}
          </p>
          <button
            onClick={() => setIsCartOpen(true)}
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <span>Open Catalog & Cart</span>
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
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition p-6 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-gray-900 text-base">
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-xs text-gray-400">
                      {new Date(order.orderDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Customer Tag */}
                    <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                      <User className="w-3 h-3 text-gray-500" />
                      <span>Customer #{order.customerId}</span>
                    </div>

                    <span className="text-base font-black text-indigo-600">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.productItems?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <img
                        src={
                          item.product?.imgUrl ||
                          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80'
                        }
                        alt={item.product?.name || 'Product'}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {item.product?.name || `Product #${item.productId}`}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Qty: {item.quantity} × ${(item.price / (item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-gray-800 text-right">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-50">
                  {/* Admin status advancer */}
                  {activeUser.role === 'ADMIN' &&
                    order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELED' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAdvanceStatus(order.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center space-x-1"
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
                        className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center space-x-1"
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
