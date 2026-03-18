'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  items: OrderItem[];
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-6">
          Your order #{orderId} has been confirmed and is being prepared.
        </p>

        {order && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.item_name} x{item.quantity}</span>
                  <span className="text-gray-900">
                    ${(parseFloat(String(item.price_at_time)) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
              <span>Total Paid</span>
              <span>${parseFloat(String(order.total_amount)).toFixed(2)}</span>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{order.payment_status}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{order.status}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/orders"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            View My Orders
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
