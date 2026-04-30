'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) router.replace('/login');
    else setReady(true);
  }, [router]);
  if (!ready) return <div className="min-h-screen bg-slate-950" />;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
