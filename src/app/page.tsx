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

  // Modal & Feedback State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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
      image_url: item.image_url || '/images/coffee.png',
    });

    // Visual feedback
    setAddedItemIds(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  const handleConfirmCustomization = (options: { milk: string; size: string; note: string; price: number }) => {
    if (selectedItem) {
      addItem({
        id: selectedItem.id,
        name: selectedItem.name,
        price: options.price, // Use calculated price from modal
        category_name: selectedItem.category_name,
        image_url: selectedItem.image_url || '/images/coffee.png',
        options: { milk: options.milk, size: options.size },
        note: options.note,
      });

      // Visual feedback
      const itemId = selectedItem.id;
      setAddedItemIds(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setAddedItemIds(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 1500);

      setIsModalOpen(false);
      setSelectedItem(null);
    }
  };
  
  const toggleExpand = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight font-cursive">Cafe Aroma</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            key={totalItems} 
            className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition relative shadow-lg shadow-primary/10"
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
              <section key={category.id} className="space-y-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight whitespace-nowrap font-cursive">{category.name}</h2>
                  <div className="h-px w-full bg-border mt-2"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {categoryItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => item.description && item.description.length > 60 && toggleExpand(item.id)}
                      className={`card-premium p-4 flex flex-col transition-all duration-500 cursor-pointer overflow-hidden ${
                        expandedItems.has(item.id) ? 'ring-2 ring-primary bg-input/50' : 'hover:border-primary'
                      }`}
                    >
                      <div className="flex flex-row gap-4 sm:gap-5 min-w-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-input relative shrink-0 shadow-inner">
                          <img
                            src={item.image_url || '/images/coffee.png'}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          {!item.is_available && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                              <span className="text-[10px] font-black text-foreground uppercase tracking-tighter">Unavailable</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg sm:text-xl text-foreground truncate">{item.name}</h3>
                              {item.description && item.description.length > 60 && (
                                <div className={`transition-transform duration-300 ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}>
                                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              )}
                            </div>
                            <span className="text-2xl font-black text-primary mt-1 block">
                              ${Number(item.price).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="hidden sm:flex justify-end mt-2">
                             <button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                              disabled={!item.is_available}
                              className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md uppercase tracking-widest flex items-center gap-2 ${
                                addedItemIds.has(item.id) ? 'bg-success text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
                              }`}
                            >
                              {addedItemIds.has(item.id) ? 'Added' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable description section */}
                      <div className={`transition-all duration-500 ease-in-out ${
                        expandedItems.has(item.id) ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex sm:hidden justify-end mt-6">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                              disabled={!item.is_available}
                              className={`w-full py-3 text-sm font-black rounded-xl transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2 ${
                                addedItemIds.has(item.id) ? 'bg-success text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
                              }`}
                            >
                              {addedItemIds.has(item.id) ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  <span>Added to Cart</span>
                                </>
                              ) : (
                                'Add to Cart'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Fallback for non-expanded view on mobile - show clamped description */}
                      {!expandedItems.has(item.id) && (
                        <p className="text-muted-foreground text-xs mt-3 line-clamp-1 sm:hidden">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Mobile action button when NOT expanded */}
                      {!expandedItems.has(item.id) && (
                         <div className="flex sm:hidden justify-end mt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                              disabled={!item.is_available}
                              className={`p-2 rounded-lg transition-all ${
                                addedItemIds.has(item.id) ? 'bg-success text-white' : 'bg-primary text-primary-foreground'
                              }`}
                            >
                               {addedItemIds.has(item.id) ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                               ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                               )}
                            </button>
                         </div>
                      )}
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
