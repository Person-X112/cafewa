'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: string;
  auth_provider: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading user accounts...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">User Management</h2>
        <p className="text-gray-500 mt-1">Manage all registered accounts and roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Role Badge */}
            <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl uppercase">
                  {user.username.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{user.display_name || user.username}</h3>
                  <p className="text-xs text-blue-500 font-medium">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>{user.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09a2 2 0 011.776-1.031h2.524a2 2 0 011.776 1.031l.054.09m-2.858-3.028A4 4 0 1112 3a4 4 0 010 8zm0 0v.5m0 0a.5.5 0 01-1 0v-.5m1 0a.5.5 0 011 0v.5" /></svg>
                  <span className="capitalize">{user.auth_provider} account</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="w-full py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
