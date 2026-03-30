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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse font-bold">Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-destructive font-bold mb-4">{error}</p>
        <Link href="/" className="text-primary hover:underline font-bold">Go back to menu</Link>
      </div>
    );
  }

  if (!order) return null;

  if (order.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-black text-success mb-4 font-cursive">This order is already paid!</h1>
        <Link href="/orders" className="text-primary hover:underline font-bold">View your orders</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-black text-primary mb-2 font-cursive tracking-tight">Checkout</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mb-8">Order #{order.id}</p>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-bold">
            {error}
          </div>
        )}

        {/* Simulated Stripe checkout */}
        <div className="card-premium p-6 sm:p-8 mb-8 bg-card shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-xs font-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <span className="font-black text-foreground uppercase tracking-widest text-xs">Simulated Payment</span>
          </div>
          <p className="text-xs text-muted-foreground mb-6 font-medium leading-relaxed">
            This is a secure simulation. In a live environment, you would proceed to a certified payment processor.
          </p>

          <div className="border-t border-border/50 pt-6 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  {item.item_name} <span className="text-[10px] bg-input px-1.5 py-0.5 rounded ml-1">×{item.quantity}</span>
                </span>
                <span className="text-foreground font-black">
                  ${(parseFloat(String(item.price_at_time)) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-6 pt-6 flex justify-between items-center">
            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Total Amount</span>
            <span className="text-3xl font-black text-primary tracking-tighter">${parseFloat(String(order.total_amount)).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
        >
          {paying ? 'Processing...' : `Pay $${parseFloat(String(order.total_amount)).toFixed(2)}`}
        </button>

        <Link href="/" className="block mt-6 text-center text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">
          Cancel and return to menu
        </Link>
      </div>
    </div>
  );
}
