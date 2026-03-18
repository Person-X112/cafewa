'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
          setError('Please login to view your orders.');
        } else {
          setError('Failed to load orders');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <header className="w-full max-w-3xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          &larr; Back to Menu
        </Link>
      </header>

      <main className="w-full max-w-3xl space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {orders.length === 0 && !error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-semibold text-gray-800">Order #{order.id}</h2>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.payment_status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.item_name} x{item.quantity}</span>
                    <span className="text-gray-800">
                      ${(parseFloat(String(item.price_at_time)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>${parseFloat(String(order.total_amount)).toFixed(2)}</span>
              </div>

              {order.payment_status === 'unpaid' && (
                <Link
                  href={`/checkout/${order.id}`}
                  className="mt-3 inline-block px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                >
                  Complete Payment
                </Link>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
