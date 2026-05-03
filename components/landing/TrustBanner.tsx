'use client';

const LOGOS = [
  'TechCorp', 'SecureNet', 'CloudNine', 'DataShield', 'CyberSafe', 'NetGuard',
];

export default function TrustBanner() {
  return (
    <section className="py-10 border-y border-slate-800/30">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Trusted by security teams worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {LOGOS.map((name) => (
            <div key={name} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
              <div className="w-6 h-6 rounded bg-slate-700" />
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
