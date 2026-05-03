'use client';
import { useEffect, useState } from 'react';

const LINES = [
  { text: '$ shadowsurface scan --target example.com', color: 'text-emerald-400' },
  { text: '[INFO] Passive DNS enumeration started...', color: 'text-slate-400' },
  { text: '[OK]   247 subdomains discovered', color: 'text-blue-400' },
  { text: '[INFO] Port scanning top 1000 ports...', color: 'text-slate-400' },
  { text: '[WARN] Open port 3389/RDP detected', color: 'text-amber-400' },
  { text: '[OK]   CVE-2023-1234 matched on nginx/1.18', color: 'text-red-400' },
  { text: '[INFO] Cloud misconfiguration audit...', color: 'text-slate-400' },
  { text: '[OK]   3 exposed S3 buckets found', color: 'text-amber-400' },
  { text: '[INFO] Generating executive report...', color: 'text-slate-400' },
  { text: '$ ', color: 'text-emerald-400' },
];

export default function TerminalTyping() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length) return;
    const line = LINES[visibleLines].text;
    if (currentChar < line.length) {
      const delay = line[currentChar] === ' ' ? 20 : Math.random() * 40 + 30;
      const t = setTimeout(() => setCurrentChar((c) => c + 1), delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setVisibleLines((l) => l + 1); setCurrentChar(0); }, 600);
      return () => clearTimeout(t);
    }
  }, [visibleLines, currentChar]);

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-slate-500">ShadowSurface CLI</span>
          </div>
          <div className="p-4 sm:p-6 font-mono text-sm leading-relaxed min-h-[260px]">
            {LINES.slice(0, visibleLines + 1).map((line, i) => (
              <div key={i} className={line.color}>
                {i < visibleLines ? line.text : line.text.slice(0, currentChar)}
                {i === visibleLines && <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
