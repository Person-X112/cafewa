'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Menu Items", href: "/admin/menu", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Orders", href: "/admin/orders", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
    { name: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans">
      {/* Sidebar for admin */}
      <aside className="w-full md:w-72 bg-primary text-primary-foreground flex flex-col shadow-2xl z-20">
        <div className="p-8 bg-primary/95 border-b border-primary-foreground/10">
          <h1 className="text-3xl font-black font-cursive tracking-tight">Cafe Admin</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-50 mt-1">Management Terminal</p>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
          {navItems.map((item) => {
            const isActive = item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-[#FDFBF7] text-primary shadow-lg scale-[1.02]" 
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-white"
                }`}
              >
                <svg 
                  className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-primary-foreground/40 group-hover:text-primary-foreground/80"}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className={`text-sm font-black tracking-wide ${isActive ? "" : "opacity-80"}`}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-primary-foreground/10 bg-black/5">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground/60 hover:text-white transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            MAIN PORTAL
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
