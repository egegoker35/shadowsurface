'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { 
    setToken(localStorage.getItem('ss_token')); 
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const logout = () => { localStorage.removeItem('ss_token'); window.location.href = '/'; };
  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-lg shadow-black/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Shadow</span>
          <span className="text-white">Surface</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</Link>
          <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {token ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <button onClick={logout} className="text-sm px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
