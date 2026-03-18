'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_name: string;
  surcharge_large: number;
  surcharge_extra_large: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu'),
      ]);
      setCategories(await catRes.json());
      setMenuItems(await menuRes.json());
    } catch (err) {
      console.error('Failed to fetch menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem?.id ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem?.id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setIsItemModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCategory?.id ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const method = editingCategory?.id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All items in it will be affected.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center animate-pulse">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Accessing Database...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-32">
      <div className="flex justify-between items-center bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl shadow-foreground/5 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-foreground tracking-tight">Menu Studio</h2>
          <p className="text-muted-foreground font-medium mt-2 max-w-sm">Sculpt your menu experience. Update prices, availability, and category details.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button
            onClick={() => { setEditingCategory({ name: '', description: '', sort_order: 0 }); setIsCategoryModalOpen(true); }}
            className="px-8 py-4 bg-input text-foreground font-black rounded-2xl border border-border hover:border-muted transition-all active:scale-[0.98] uppercase tracking-widest text-[10px]"
          >
            New Category
          </button>
          <button
            onClick={() => { setEditingItem({ name: '', description: '', price: 0, category_id: categories[0]?.id, is_available: true, surcharge_large: 0, surcharge_extra_large: 0 }); setIsItemModalOpen(true); }}
            className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest text-[10px]"
          >
            Add Menu Item
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
      </div>

      <div className="space-y-16">
        {categories.map((cat) => (
          <section key={cat.id} className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-end border-b border-border pb-6">
              <div>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{cat.name}</h3>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">{cat.description || 'No description provided'}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                  className="px-4 py-2 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg border border-primary/20 uppercase tracking-widest transition-all"
                >
                  Configure
                </button>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="px-4 py-2 text-[10px] font-black text-destructive hover:bg-destructive/5 rounded-lg border border-destructive/20 uppercase tracking-widest transition-all"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuItems.filter(item => item.category_id === cat.id).map((item) => (
                <div key={item.id} className="card-premium p-6 group hover:border-primary transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black mt-1 tracking-[0.15em] uppercase opacity-60">ID #{item.id}</p>
                    </div>
                    <span className="text-2xl font-black text-foreground">${Number(item.price).toFixed(2)}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 h-10 mb-6 leading-relaxed">{item.description}</p>
                  
                  {cat.name.toLowerCase() === 'coffee' && (
                    <div className="flex gap-3 mb-6">
                        <div className="bg-input border border-border px-3 py-1.5 rounded-xl flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase">Large</span>
                            <span className="text-xs font-black text-foreground">+${Number(item.surcharge_large || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-input border border-border px-3 py-1.5 rounded-xl flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase">Extra Large</span>
                            <span className="text-xs font-black text-foreground">+${Number(item.surcharge_extra_large || 0).toFixed(2)}</span>
                        </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${item.is_available ? 'bg-success shadow-success/40' : 'bg-destructive shadow-destructive/40'}`}></div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.is_available ? 'Active' : 'Archived'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                        className="p-3 rounded-xl bg-input text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                        title="Edit Item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-3 rounded-xl bg-input text-foreground hover:bg-destructive hover:text-white transition-all duration-300 shadow-sm"
                        title="Delete Item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
            <form onSubmit={handleSaveItem}>
              <div className="p-10 border-b border-border flex justify-between items-start">
                <div>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{editingItem?.id ? 'Edit Item' : 'New Creation'}</h3>
                    <p className="text-muted-foreground font-bold text-xs mt-1 uppercase tracking-widest opacity-70">Define the specifics of this treat</p>
                </div>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-input rounded-xl transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Display Name</label>
                    <input
                      required
                      value={editingItem?.name}
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all shadow-inner"
                      placeholder="e.g. Velvet Espresso"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Base Price ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingItem?.price}
                      onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-black transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Description</label>
                  <textarea
                    rows={3}
                    value={editingItem?.description}
                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-medium transition-all shadow-inner resize-none"
                    placeholder="Describe the sensory experience..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Menu Section</label>
                    <select
                      value={editingItem?.category_id}
                      onChange={e => setEditingItem({ ...editingItem, category_id: parseInt(e.target.value) })}
                      className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Status</label>
                    <div className="flex items-center px-5 h-[64px] bg-input border-2 border-border rounded-2xl">
                      <label className="flex items-center cursor-pointer group w-full">
                        <input
                          type="checkbox"
                          checked={editingItem?.is_available}
                          onChange={e => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                          className="w-6 h-6 rounded-lg border-muted bg-background text-primary focus:ring-primary/30 transition-all"
                        />
                        <span className="ml-4 text-xs font-black text-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Currently Available</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Surcharges Section */}
                <div className="p-8 bg-primary/5 rounded-[2rem] border-2 border-primary/10 space-y-6">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        Size Surcharges (Coffee Only)
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Large Surcharge ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editingItem?.surcharge_large}
                                onChange={e => setEditingItem({ ...editingItem, surcharge_large: parseFloat(e.target.value) })}
                                className="w-full p-4 bg-background border-2 border-border rounded-xl focus:border-primary outline-none text-foreground font-black transition-all"
                                placeholder="0.50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">XL Surcharge ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editingItem?.surcharge_extra_large}
                                onChange={e => setEditingItem({ ...editingItem, surcharge_extra_large: parseFloat(e.target.value) })}
                                className="w-full p-4 bg-background border-2 border-border rounded-xl focus:border-primary outline-none text-foreground font-black transition-all"
                                placeholder="1.00"
                            />
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-10 bg-input border-t border-border flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-8 py-5 text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-[0.2em] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[11px]"
                >
                  {editingItem?.id ? 'Synchronize Updates' : 'Publish Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
            <form onSubmit={handleSaveCategory}>
              <div className="p-10 border-b border-border">
                <h3 className="text-3xl font-black text-foreground tracking-tight">{editingCategory?.id ? 'Edit Category' : 'New Section'}</h3>
                <p className="text-muted-foreground font-bold text-xs mt-1 uppercase tracking-widest opacity-70">Architecture your menu</p>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Section Title</label>
                  <input
                    required
                    value={editingCategory?.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-bold transition-all shadow-inner"
                    placeholder="e.g. Signature Blends"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Visual Index (Sort)</label>
                  <input
                    type="number"
                    value={editingCategory?.sort_order}
                    onChange={e => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) })}
                    className="w-full p-5 bg-input border-2 border-border rounded-2xl focus:border-primary outline-none text-foreground font-black transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="p-10 bg-input border-t border-border flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-4 text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest text-[11px]"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
