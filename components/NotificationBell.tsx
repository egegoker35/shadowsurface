'use client';
import { useEffect, useState, useRef } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []); setUnread(d.unread || 0); }
  };

  useEffect(() => {
    if (token) fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markRead = async (id?: string) => {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: id || 'all' }) });
    fetchNotifications();
  };

  if (!token) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unread > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && <button onClick={() => markRead('all')} className="text-xs text-emerald-400 hover:text-emerald-300">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <p className="px-4 py-6 text-sm text-slate-500 text-center">No notifications</p>}
            {notifications.map((n) => (
              <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }} className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 ${n.read ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 shrink-0" />}
                  <div className="flex-1"><div className="text-sm font-medium">{n.title}</div><div className="text-xs text-slate-400 mt-0.5">{n.message}</div><div className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
