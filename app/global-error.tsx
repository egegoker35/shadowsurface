'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="bg-slate-950 text-white flex items-center justify-center min-h-screen">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Critical Error</h1>
          <p className="text-slate-400 mb-6">The application encountered a critical error. Please refresh the page.</p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
