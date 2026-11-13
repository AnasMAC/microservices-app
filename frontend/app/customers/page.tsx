'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '../../lib/types';
import { getCustomers, createCustomer } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Plus, RefreshCw, X, Mail, ShieldCheck, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const { isAuthenticated, user, login } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchCustomersList = async () => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const items = await getCustomers();
      setCustomers(items || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch customer records from Customer Service');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchCustomersList();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      if (!newName.trim() || !newEmail.trim()) {
        throw new Error('Name and email are required');
      }

      await createCustomer({
        name: newName.trim(),
        email: newEmail.trim(),
      });

      setIsModalOpen(false);
      setNewName('');
      setNewEmail('');
      await fetchCustomersList();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  // -------------------------------------------------------------
  // Role Guard: Customers CANNOT see this page
  // -------------------------------------------------------------
  if (!user?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-zinc-200 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[11px] font-black tracking-widest text-amber-700 uppercase bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200">
              403 Forbidden • Confidential Directory
            </span>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-3">
              Administrator Access Required
            </h2>
            <p className="text-xs text-zinc-600 max-w-md mx-auto mt-2 leading-relaxed">
              Customers cannot view or access records belonging to other customers. This section is restricted exclusively to administrators with verified <span className="font-mono font-bold text-zinc-800">ROLE_ADMIN</span> authority.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isAuthenticated ? (
              <button
                onClick={login}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Admin Account</span>
              </button>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Switch to Admin Account</span>
              </button>
            )}

            <Link
              href="/products"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold text-xs transition"
            >
              <span>Back to Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Admin View: Full Customer Management
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Customer Service Management (Admin Exclusive)</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
            Registered Customers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Directory of registered customer accounts, IDs, and contact points.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCustomersList}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition"
            title="Refresh Customers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center">
          <AlertCircle className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4 text-right">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Loading customer database...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No customer accounts registered yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center text-gray-600 text-xs">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Customer
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Register New Customer</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@acme.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm shadow-sm"
                >
                  {isCreating ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
