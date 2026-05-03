'use client';
import { useEffect, useState } from 'react';

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(duration / end, 20);
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function LiveStats() {
  const stats = [
    { label: 'Subdomains Discovered', value: 12847, suffix: '' },
    { label: 'Ports Scanned', value: 3402000, suffix: '+' },
    { label: 'CVEs Mapped', value: 1420, suffix: '' },
    { label: 'Cloud Assets Audited', value: 8930, suffix: '' },
  ];

  return (
    <div className="py-8 border-y border-slate-800/50 bg-slate-950/50">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              <AnimatedCounter end={s.value} suffix={s.suffix} />
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
