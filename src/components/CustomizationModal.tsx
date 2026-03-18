'use client';

import { useState } from 'react';

interface CustomizationModalProps {
  item: {
    id: number;
    name: string;
    price: number;
    category_name: string;
    surcharge_large?: number;
    surcharge_extra_large?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { milk: string; size: string; note: string; price: number }) => void;
}

export default function CustomizationModal({ item, isOpen, onClose, onConfirm }: CustomizationModalProps) {
  const [milk, setMilk] = useState('Whole Milk');
  const [size, setSize] = useState('Regular');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const basePrice = Number(item.price);
  const surcharge = size === 'Large' 
    ? Number(item.surcharge_large || 0) 
    : size === 'Extra Large' 
      ? Number(item.surcharge_extra_large || 0) 
      : 0;
  
  const totalPrice = basePrice + surcharge;

  const milkOptions = ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Skim Milk'];
  const sizeOptions = ['Regular', 'Large', 'Extra Large'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
        <div className="p-8 border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">{item.name}</h2>
              <p className="text-muted-foreground font-bold text-xs mt-1 uppercase tracking-widest">Customize your drink</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-input text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Size Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Select Size</label>
            <div className="grid grid-cols-3 gap-3">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-4 px-2 rounded-2xl text-xs font-black transition-all duration-300 border-2 ${
                    size === s 
                      ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' 
                      : 'border-border bg-input text-muted-foreground hover:border-muted'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{s}</span>
                    {s !== 'Regular' && (
                      <span className="text-[8px] opacity-70">
                        +${s === 'Large' ? Number(item.surcharge_large || 0).toFixed(2) : Number(item.surcharge_extra_large || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Milk Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Milk Type</label>
            <div className="space-y-2">
              {milkOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setMilk(m)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                    milk === m 
                      ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' 
                      : 'border-border bg-input text-muted-foreground hover:border-muted'
                  }`}
                >
                  <span className="font-bold text-sm tracking-tight">{m}</span>
                  {milk === m && (
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center p-1">
                      <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Special Request */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Special Request</label>
            <textarea
              placeholder="e.g. A splash of milk, extra hot..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-5 rounded-2xl border-2 border-border bg-input text-foreground font-medium focus:border-primary focus:bg-card transition-all outline-none resize-none h-28 text-sm"
            />
          </div>
        </div>

        <div className="p-8 bg-input border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Total Price</span>
            <span className="text-3xl font-black text-foreground">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => onConfirm({ milk, size, note, price: totalPrice })}
            className="w-full py-5 bg-primary hover:opacity-90 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/30 transition-all duration-300 active:scale-95 uppercase tracking-widest text-xs"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
