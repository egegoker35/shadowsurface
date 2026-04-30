'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(localStorage.getItem('ss_token')); }, []);
  const logout = () => { localStorage.removeItem('ss_token'); window.location.href = '/'; };
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-emerald-400">ShadowSurface</Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm text-slate-300 hover:text-white">Features</Link>
          <Link href="/pricing" className="text-sm text-slate-300 hover:text-white">Pricing</Link>
          <Link href="/blog" className="text-sm text-slate-300 hover:text-white">Blog</Link>
          <Link href="/contact" className="text-sm text-slate-300 hover:text-white">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <button onClick={logout} className="text-sm px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-300 hover:text-white">Sign In</Link>
              <Link href="/register" className="text-sm px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
