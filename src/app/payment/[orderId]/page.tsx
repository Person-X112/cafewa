'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setErrorMessage('Order not found');
        }
      } catch (err) {
        setErrorMessage('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setErrorMessage('');

    try {
      // Confirm payment with the existing API
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: Number(orderId),
          payment_session_id: order.payment_session_id
        }),
      });

      if (res.ok) {
        // Success! Redirect to orders
        router.push('/orders');
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Payment failed. Please try again.');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-foreground">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
      <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Initializing Secure Checkout...</p>
    </div>
  );

  if (errorMessage && !order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-foreground text-center">
      <h1 className="text-3xl font-black mb-4">Error</h1>
      <p className="text-muted-foreground mb-8 font-medium">{errorMessage}</p>
      <Link href="/cart" className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs">Return to Cart</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
      <div className="w-full max-w-lg">
        <header className="mb-12">
            <h1 className="text-4xl font-black tracking-tight mb-2">Checkout</h1>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Order #{orderId}</p>
        </header>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Order Summary Card */}
            <div className="card-premium p-8 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black tracking-tight">Summary</h2>
                    <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">Simulated Stripe</span>
                </div>
                <div className="space-y-4">
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-base leading-tight">{item.quantity}x {item.item_name}</p>
                            </div>
                            <span className="font-black text-foreground/80">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="h-px bg-border my-6"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-black">Total to pay</span>
                        <span className="text-3xl font-black text-primary">${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Card Number</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="4242 4242 4242 4242" 
                                className="w-full p-5 bg-card border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all shadow-inner"
                                required
                                defaultValue="4242 4242 4242 4242"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-2">
                                <div className="w-8 h-5 bg-muted/20 rounded-sm"></div>
                                <div className="w-8 h-5 bg-muted/20 rounded-sm"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Expiry Date</label>
                            <input 
                                type="text" 
                                placeholder="MM / YY" 
                                className="w-full p-5 bg-card border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all shadow-inner"
                                required
                                defaultValue="12 / 26"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">CVC</label>
                            <input 
                                type="text" 
                                placeholder="123" 
                                className="w-full p-5 bg-card border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all shadow-inner"
                                required
                                defaultValue="123"
                            />
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-bold animate-in shake scale-95 duration-500">
                        {errorMessage}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={paying}
                    className="w-full py-6 bg-primary text-primary-foreground font-black rounded-2xl shadow-2xl shadow-primary/30 hover:opacity-90 transition active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
                >
                    {paying ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white border-t-transparent animate-spin rounded-full"></div>
                            <span>Verifying with Global Gateway...</span>
                        </>
                    ) : (
                        <>
                            <span>Authorize Payment</span>
                            <span className="opacity-40">&mdash;</span>
                            <span>${Number(order.total_amount).toFixed(2)}</span>
                        </>
                    )}
                </button>
            </form>

            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secure 256-bit encrypted simulation
            </p>
        </div>
      </div>
    </div>
  );
}
