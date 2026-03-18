'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  payment_session_id: string;
  items: OrderItem[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setError('Order not found');
        }
      } catch {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handlePay = async () => {
    if (!order) return;

    setPaying(true);
    setError('');

    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          payment_session_id: order.payment_session_id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/payment-success/${order.id}`);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch {
      setError('Payment error. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">Go back to menu</Link>
      </div>
    );
  }

  if (!order) return null;

  if (order.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold text-green-700 mb-4">This order is already paid!</h1>
        <Link href="/orders" className="text-blue-600 hover:underline">View your orders</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-6">Order #{order.id}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Simulated Stripe checkout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="font-semibold text-gray-800">Stripe Payment (Simulated)</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This is a simulated payment gateway. In production, you would be redirected to Stripe&apos;s secure checkout.
          </p>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.item_name} x{item.quantity}
                </span>
                <span className="text-gray-900 font-medium">
                  ${(parseFloat(String(item.price_at_time)) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${parseFloat(String(order.total_amount)).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 text-lg"
        >
          {paying ? 'Processing Payment...' : `Pay $${parseFloat(String(order.total_amount)).toFixed(2)}`}
        </button>

        <Link href="/" className="block mt-4 text-center text-sm text-gray-500 hover:text-gray-700">
          Cancel and return to menu
        </Link>
      </div>
    </div>
  );
}
