'use client';

export default function RiskPulse() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
              <span className="text-xl font-bold text-rose-400">!</span>
            </div>
            <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
          </div>
          <div>
            <h3 className="font-bold text-white">Average Risk Score: 73/100</h3>
            <p className="text-sm text-slate-400">Based on 10,000+ scans in the last 30 days.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['Critical', 'High', 'Medium', 'Low'].map((label, i) => {
            const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-8 rounded-full ${colors[i]} opacity-80`} />
                <span className="text-[10px] text-slate-500 uppercase">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
