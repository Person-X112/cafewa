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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome to the cafe administration panel.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
          <span className="text-blue-500 font-medium text-sm">Today&apos;s Orders</span>
          <span className="text-3xl font-bold mt-2 text-blue-900 block">{stats.todayOrders}</span>
        </div>
        <div className="bg-green-50 border border-green-100 p-6 rounded-lg">
          <span className="text-green-500 font-medium text-sm">Total Revenue (Paid)</span>
          <span className="text-3xl font-bold mt-2 text-green-900 block">${stats.totalRevenue.toFixed(2)}</span>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-lg">
          <span className="text-purple-500 font-medium text-sm">Active Menu Items</span>
          <span className="text-3xl font-bold mt-2 text-purple-900 block">{stats.menuItemCount}</span>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Orders</h3>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">Order #{order.id}</span>
                    <span className="text-xs text-gray-400">
                      User #{order.user_id} &middot; {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.items.map((item) => `${item.item_name} x${item.quantity}`).join(', ')}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.payment_status}
                    </span>
                    <span className="text-sm font-semibold">${parseFloat(String(order.total_amount)).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
