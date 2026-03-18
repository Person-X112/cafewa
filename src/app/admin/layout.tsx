import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar for admin */}
      <aside className="w-full md:w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 bg-slate-900 border-b border-slate-700">
          <h1 className="text-xl font-bold">Cafe Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 bg-slate-700 rounded-md">
            Dashboard
          </Link>
          <Link href="/admin/menu" className="block px-4 py-2 hover:bg-slate-700 rounded-md transition text-slate-300">
            Menu Items
          </Link>
          <Link href="/admin/orders" className="block px-4 py-2 hover:bg-slate-700 rounded-md transition text-slate-300">
            Orders
          </Link>
          <Link href="/admin/users" className="block px-4 py-2 hover:bg-slate-700 rounded-md transition text-slate-300">
            Users
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link href="/" className="block px-4 py-2 text-sm text-slate-400 hover:text-white transition">
            &larr; Back to Main Site
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
