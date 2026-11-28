'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

const MENU = [
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/scheduled-scans', label: 'Scheduled Scans' },
  { href: '/dashboard/integrations', label: 'Integrations' },
  { href: '/dashboard/domains', label: 'Domains' },
  { href: '/dashboard/team', label: 'Team' },
];

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setToken(localStorage.getItem('ss_token'));
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => { localStorage.removeItem('ss_token'); window.location.href = '/'; };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled || mobileOpen
          ? 'border-b border-cream/10 bg-ink/90 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="ShadowSurface home">
          <span aria-hidden className="grid h-[15px] w-[15px] grid-cols-2 gap-[3px]">
            <span className="bg-jade" />
            <span className="bg-jade/30" />
            <span className="bg-jade/30" />
            <span className="bg-jade" />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-cream">
            Shadow<span className="text-jadeLight/70">Surface</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + '/');
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[13px] transition-colors ${
                  active ? 'text-jadeLight' : 'text-dim hover:text-cream'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-5 md:flex">
          {token ? (
            <>
              <Link href="/dashboard" className="text-[13px] text-dim transition-colors hover:text-cream">
                Dashboard
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-[3px] border border-cream/15 px-3 py-1.5 text-[13px] text-cream transition-colors hover:border-cream/30"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-jade text-[10px] font-bold text-ink">
                    P
                  </span>
                  <span>Profile</span>
                  <svg
                    className={`h-3 w-3 text-faint transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[3px] border border-cream/15 bg-ink2 shadow-2xl shadow-black/60">
                    {MENU.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-dim transition-colors hover:bg-jade/10 hover:text-cream"
                      >
                        {m.label}
                      </Link>
                    ))}
                    <div className="border-t border-cream/10" />
                    <Link
                      href="/privacy"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-[13px] text-dim transition-colors hover:bg-jade/10 hover:text-cream"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-[13px] text-dim transition-colors hover:bg-jade/10 hover:text-cream"
                    >
                      Terms of Service
                    </Link>
                    <div className="border-t border-cream/10" />
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-[#C9726A] transition-colors hover:bg-cream/5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-dim transition-colors hover:text-jadeLight">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-[3px] bg-jade px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-[#6FC7A5]"
              >
                Start scanning
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center text-cream md:hidden"
        >
          <span className="relative block h-3 w-5">
            <span
              className={`absolute left-0 h-px w-5 bg-cream transition-transform ${
                mobileOpen ? 'top-1.5 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-cream transition-opacity ${
                mobileOpen ? 'top-1.5 opacity-0' : 'top-1.5'
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-cream transition-transform ${
                mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'
              }`}
            />
          </span>
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-cream/10 bg-ink px-6 pb-6 pt-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block border-b border-cream/10 py-3 text-[14px] text-cream"
            >
              {l.label}
            </Link>
          ))}
          {token ? (
            <>
              <Link href="/dashboard" className="block border-b border-cream/10 py-3 text-[14px] text-cream">
                Dashboard
              </Link>
              {MENU.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="block border-b border-cream/10 py-3 text-[13px] text-dim"
                >
                  {m.label}
                </Link>
              ))}
              <button
                onClick={logout}
                className="mt-4 w-full rounded-[3px] border border-cream/20 py-2.5 text-[13px] text-cream"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="mt-4 flex gap-3">
              <Link
                href="/login"
                className="flex-1 rounded-[3px] border border-cream/20 py-2.5 text-center text-[13px] text-cream"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-[3px] bg-jade py-2.5 text-center text-[13px] font-semibold text-ink"
              >
                Start scanning
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
