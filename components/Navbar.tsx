'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(localStorage.getItem('ss_token'));
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          {token ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">P</div>
                  <span>Profile</span>
                  <svg className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Settings</Link>
                    <Link href="/privacy" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="/terms" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Terms of Service</Link>
                    <div className="border-t border-slate-700" />
                    <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">Logout</button>
                  </div>
                )}
              </div>
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
