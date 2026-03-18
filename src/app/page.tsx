'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CustomizationModal from "@/components/CustomizationModal";

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  category_name: string;
  image_url: string;
  is_available: boolean;
  surcharge_large: number;
  surcharge_extra_large: number;
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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
    // If it's a coffee item, show customization modal
    if (item.category_name?.toLowerCase() === 'coffee') {
      setSelectedItem(item);
      setIsModalOpen(true);
      return;
    }

    // Otherwise add directly
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(String(item.price)),
      category_name: item.category_name,
    });
  };

  const handleConfirmCustomization = (options: { milk: string; size: string; note: string; price: number }) => {
    if (selectedItem) {
      addItem({
        id: selectedItem.id,
        name: selectedItem.name,
        price: options.price, // Use calculated price from modal
        category_name: selectedItem.category_name,
        options: { milk: options.milk, size: options.size },
        note: options.note,
      });
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-foreground tracking-tight">Cafe Menu</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="px-5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition relative shadow-lg shadow-foreground/10"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
                {totalItems}
              </span>
            )}
          </Link>
          {authLoading ? null : user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link href="/admin" className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition text-sm shadow-md shadow-primary/20">
                  Admin
                </Link>
              )}
              <Link href="/orders" className="px-4 py-2 bg-success text-white font-bold rounded-xl hover:opacity-90 transition text-sm shadow-md shadow-success/20">
                My Orders
              </Link>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Logged in as</span>
                <span className="text-sm font-bold text-foreground">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 bg-card hover:bg-input text-foreground rounded-xl border border-border transition-colors group"
                title="Logout"
              >
                <svg className="w-5 h-5 group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition shadow-xl shadow-primary/20"
            >
              Login to Order
            </Link>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-16">
        {loadingMenu ? (
          <div className="flex flex-col items-center py-20 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Arriving shortly...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-border">
            <p className="text-muted-foreground font-medium">No menu items available at the moment.</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryItems = menuItems.filter((item) => item.category_id === category.id);
            if (categoryItems.length === 0) return null;
            return (
              <section key={category.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-foreground tracking-tight whitespace-nowrap">{category.name}</h2>
                  <div className="h-px w-full bg-border mt-2"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="card-premium p-4 flex gap-5 group hover:border-primary transition-all duration-300">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-input relative shrink-0 shadow-inner">
                        <img 
                          src={item.image_url || '/images/coffee.png'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-black text-foreground uppercase tracking-tighter">Unavailable</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mt-1 font-medium">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <span className="text-2xl font-black text-foreground">
                            ${Number(item.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.is_available}
                            className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale scale-95 group-hover:scale-100 active:scale-90 shadow-lg shadow-primary/20 uppercase tracking-widest"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </div>
  );
}
