'use client';
import { useState, useRef, useEffect } from 'react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi! I am ShadowAI. Ask me about security, vulnerabilities, or your scan results.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
    const data = await res.json();
    setMessages((m) => [...m, { role: 'ai', text: data.reply || 'Sorry, I did not understand.' }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-80 h-96 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-emerald-600 text-white font-semibold flex justify-between items-center">
            <span>ShadowAI</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-slate-200">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.text}</span>
              </div>
            ))}
            {loading && <div className="text-sm text-slate-400">ShadowAI is typing...</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="p-3 border-t border-slate-800 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" />
            <button type="submit" disabled={loading} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">Send</button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center text-xl font-bold">
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}
