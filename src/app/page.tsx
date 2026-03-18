'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  category_name: string;
  is_available: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const { addItem, totalItems } = useCart();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    async function fetchMenu() {
      try {
        const [catRes, menuRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu'),
        ]);
        const cats = await catRes.json();
        const items = await menuRes.json();
        setCategories(Array.isArray(cats) ? cats : []);
        setMenuItems(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoadingMenu(false);
      }
    }
    fetchMenu();
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(String(item.price)),
      category_name: item.category_name,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800">Cafe Menu</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition relative"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          {authLoading ? null : user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link href="/admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                  Admin
                </Link>
              )}
              <Link href="/orders" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                My Orders
              </Link>
              <span className="text-sm text-gray-600">{user.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Login to Order
            </Link>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-12">
        {loadingMenu ? (
          <p className="text-gray-500 text-center">Loading menu...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 text-center">No menu items available.</p>
        ) : (
          categories.map((category) => {
            const categoryItems = menuItems.filter((item) => item.category_id === category.id);
            if (categoryItems.length === 0) return null;
            return (
              <section key={category.id} className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">{category.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-gray-800">{item.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                        <span className="font-semibold text-gray-900 mt-2 inline-block">
                          ${parseFloat(String(item.price)).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.is_available}
                        className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {item.is_available ? 'Add to Cart' : 'Unavailable'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
