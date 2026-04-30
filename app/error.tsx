'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-6">
          {error.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
