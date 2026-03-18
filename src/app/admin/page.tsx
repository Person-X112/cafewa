'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface Stats {
  todayOrders: number;
  totalRevenue: number;
  menuItemCount: number;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, totalRevenue: 0, menuItemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/menu'),
      ]);
      const ordersData = await ordersRes.json();
      const menuData = await menuRes.json();

      const ordersList = Array.isArray(ordersData) ? ordersData : [];
      setOrders(ordersList);

      // Calculate stats
      const today = new Date().toDateString();
      const todayOrders = ordersList.filter(
        (o: Order) => new Date(o.created_at).toDateString() === today
      ).length;
      const totalRevenue = ordersList
        .filter((o: Order) => o.payment_status === 'paid')
        .reduce((sum: number, o: Order) => sum + parseFloat(String(o.total_amount)), 0);
      const menuItemCount = Array.isArray(menuData) ? menuData.length : 0;

      setStats({ todayOrders, totalRevenue, menuItemCount });
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center animate-pulse">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Assembling Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <div className="animate-in fade-in duration-700">
        <h2 className="text-4xl font-black text-foreground tracking-tight">Intelligence Hub</h2>
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] mt-2 opacity-70">Metric Overview & Command Center</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-premium p-8 relative overflow-hidden group border-primary/20 bg-primary/[0.02]">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] relative z-10">Today&apos;s Velocity</span>
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-5xl font-black text-foreground tracking-tighter">{stats.todayOrders}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Orders</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        </div>
        
        <div className="card-premium p-8 relative overflow-hidden group border-success/20 bg-success/[0.02]">
          <span className="text-[10px] font-black text-success uppercase tracking-[0.2em] relative z-10">Terminal Revenue</span>
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-5xl font-black text-foreground tracking-tighter">${Number(stats.totalRevenue).toFixed(2)}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">USD</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl group-hover:bg-success/10 transition-colors"></div>
        </div>

        <div className="card-premium p-8 relative overflow-hidden group border-accent/20 bg-accent/[0.02]">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] relative z-10">Menu Portfolio</span>
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-5xl font-black text-foreground tracking-tighter">{stats.menuItemCount}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Items</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl group-hover:bg-accent/10 transition-colors"></div>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-2xl font-black text-foreground tracking-tight">Recent Activity</h3>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{orders.length} TOTAL RECORDS</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-20 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-border">
             <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Awaiting customer interaction</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="bg-card p-6 rounded-3xl border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 bg-input rounded-2xl border border-border">
                    <span className="font-black text-foreground tracking-tighter text-xl">#{order.id}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Client {order.user_id || 'Guest'}</span>
                    <span className="w-1 h-1 bg-border rounded-full"></span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="text-sm text-foreground font-bold line-clamp-1 opacity-80">
                    {order.items.map((item) => `${item.item_name} ×${item.quantity}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-foreground tracking-tighter">${parseFloat(String(order.total_amount)).toFixed(2)}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                        order.payment_status === 'paid' ? 'text-success' : 'text-warning'
                        }`}>
                        {order.payment_status}
                        </span>
                    </div>

                    <div className="relative">
                        <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className={`text-[9px] font-black py-2 pl-3 pr-8 rounded-xl appearance-none border-2 transition-all cursor-pointer uppercase tracking-widest outline-none ${
                                order.status === 'completed' ? 'border-success/30 bg-success/5 text-success' : 
                                order.status === 'cancelled' ? 'border-destructive/30 bg-destructive/5 text-destructive' : 
                                'border-border bg-input text-foreground'
                            }`}
                        >
                            {statusOptions.map((s) => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
