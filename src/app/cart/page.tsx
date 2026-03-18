'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, getCartKey } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function CartPage() {
  const { cart, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (cart.length === 0) return;

    setPlacing(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_amount: totalPrice,
          items: cart.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity || 1,
            price_at_time: item.price,
            customization: JSON.stringify({ options: item.options, note: item.note })
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        // Redirect to payment simulation immediately
        router.push(`/payment/${data.id}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-foreground">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight text-center text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8 text-center font-medium max-w-xs">Looks like you haven't added any treats to your selection yet.</p>
        <Link
          href="/"
          className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition uppercase tracking-widest text-xs"
        >
          Explore the Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
      <header className="w-full max-w-2xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black tracking-tight">Your Cart</h1>
        <Link href="/" className="text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
          <span>&larr;</span>
          <span>Back to Menu</span>
        </Link>
      </header>

      <div className="w-full max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {cart.map((item) => {
            const itemKey = getCartKey(item);
            return (
              <div key={itemKey} className="card-premium p-5 flex items-center gap-5 animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-input rounded-xl overflow-hidden shrink-0 border border-border">
                   <img src={`/images/${item.category_name?.toLowerCase().includes('coffee') ? 'coffee' : item.category_name?.toLowerCase().includes('tea') ? 'tea' : item.category_name?.toLowerCase().includes('pastry') ? 'pastry' : 'sandwich'}.png`} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                  {item.options && (
                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider text-primary mt-1.5 opacity-80">
                      {item.options?.size && <span className="bg-primary/5 px-1.5 rounded">{item.options.size}</span>}
                      {item.options?.milk && <span className="bg-primary/5 px-1.5 rounded">{item.options.milk}</span>}
                    </div>
                  )}
                  {item.note && (
                    <p className="text-[11px] font-medium text-muted-foreground mt-2 italic border-l-2 border-border pl-2 line-clamp-1">{item.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-input rounded-xl p-1 border border-border">
                    <button
                      onClick={() => updateQuantity(itemKey, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card text-foreground transition-colors font-black"
                    >
                      -
                    </button>
                    <span className="font-black w-6 text-center text-sm">{item.quantity || 1}</span>
                    <button
                      onClick={() => updateQuantity(itemKey, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card text-foreground transition-colors font-black"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <span className="font-black text-lg">
                      ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(itemKey)}
                      className="block text-[10px] text-destructive font-black uppercase tracking-widest mt-1 hover:opacity-80 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card p-8 rounded-[2rem] border border-border shadow-2xl shadow-foreground/5 mt-8">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
              <span>Service Fee</span>
              <span>$0.00</span>
            </div>
            <div className="h-px bg-border my-4"></div>
            <div className="flex justify-between items-center text-2xl font-black">
              <span className="tracking-tight">Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full py-5 bg-success text-white font-black rounded-2xl shadow-xl shadow-success/20 hover:opacity-90 transition active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            {placing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                <span>Securing your spot...</span>
              </>
            ) : !authLoading && !user ? 'Login to Checkout' : 'Secure Checkout'}
          </button>

          <button
            onClick={clearCart}
            className="w-full mt-4 py-2 text-muted-foreground font-black hover:text-destructive transition-colors text-[10px] uppercase tracking-widest"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}
