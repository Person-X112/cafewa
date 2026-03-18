'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  price_at_time: number;
  customization?: string; // JSON string
}

// Helper to parse customization
const formatCustomization = (jsonStr?: string) => {
  if (!jsonStr) return null;
  try {
    const data = JSON.parse(jsonStr);
    const parts = [];
    if (data.options?.size) parts.push(data.options.size);
    if (data.options?.milk) parts.push(data.options.milk);
    if (data.note) parts.push(`Note: ${data.note}`);
    return parts.join(' | ');
  } catch {
    return null;
  }
};

interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

  if (loading) return (
    <div className="p-20 flex flex-col items-center animate-pulse">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Syncing Orders...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-32">
      <div className="flex justify-between items-center bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl shadow-foreground/5 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-foreground tracking-tight">Order Command</h2>
          <p className="text-muted-foreground font-medium mt-2 max-w-sm">Manage the flow of treats. Track status, verify payments, and handle customizations.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-5 rounded-2xl bg-input text-foreground border border-border hover:border-muted hover:bg-input/80 transition-all active:scale-[0.95] relative z-10 shadow-sm"
          title="Refresh Feed"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
      </div>

      <div className="bg-card rounded-[2.5rem] shadow-2xl shadow-foreground/5 border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        {orders.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-input rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-muted-foreground opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No active orders in the queue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-input/50 border-b border-border">
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center w-32 border-r border-border/50">Trace ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Manifest</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Value</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Verification</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-8 py-8 text-center border-r border-border/30">
                      <span className="font-black text-foreground tracking-tighter text-xl group-hover:text-primary transition-colors">#{order.id}</span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground text-sm uppercase tracking-wider">Client {order.user_id || 'Anonymous'}</span>
                        <span className="text-[10px] text-muted-foreground font-bold mt-1.5 opacity-70">
                            {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8 max-w-md">
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-foreground font-black text-xs uppercase">{item.quantity}x</span>
                                <span className="font-black text-foreground text-xs uppercase tracking-tight">{item.item_name}</span>
                            </div>
                            {item.customization && (
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-6 opacity-60">
                                {formatCustomization(item.customization)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <span className="font-black text-foreground text-xl tracking-tighter">${Number(order.total_amount).toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest border-2 ${
                        order.payment_status === 'paid' 
                        ? 'bg-success/5 text-success border-success/20' 
                        : 'bg-warning/5 text-warning border-warning/20'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <div className="relative inline-block">
                        <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className={`text-[10px] font-black py-2.5 pl-4 pr-10 rounded-xl appearance-none border-2 transition-all cursor-pointer uppercase tracking-widest outline-none shadow-sm ${
                            order.status === 'completed' ? 'border-success/30 bg-success/5 text-success focus:border-success' : 
                            order.status === 'cancelled' ? 'border-destructive/30 bg-destructive/5 text-destructive focus:border-destructive' : 
                            'border-border bg-input text-foreground focus:border-primary'
                            }`}
                        >
                            {statusOptions.map((s) => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
