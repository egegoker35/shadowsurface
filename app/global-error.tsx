'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="bg-ink text-cream flex items-center justify-center min-h-screen">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold text-[#E28B7B] mb-4">Critical Error</h1>
          <p className="text-dim mb-6">The application encountered a critical error. Please refresh the page.</p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
