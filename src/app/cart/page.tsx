'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (items.length === 0) return;

    setPlacing(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        router.push(`/checkout/${data.id}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Add some items from the menu!</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Your Cart ({totalItems})</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          &larr; Continue Shopping
        </Link>
      </header>

      <main className="w-full max-w-2xl space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{item.name}</h3>
              {item.category_name && (
                <p className="text-gray-400 text-xs">{item.category_name}</p>
              )}
              <p className="text-gray-600 text-sm mt-1">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
              <span className="w-20 text-right font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-2 text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
          <div className="flex justify-between items-center text-xl font-bold text-gray-900">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full mt-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {placing ? 'Placing Order...' : !authLoading && !user ? 'Login to Place Order' : 'Place Order'}
          </button>

          <button
            onClick={clearCart}
            className="w-full mt-2 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Clear Cart
          </button>
        </div>
      </main>
    </div>
  );
}
