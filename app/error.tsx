'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink text-cream">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-bold text-[#E28B7B] mb-4">Something went wrong</h1>
        <p className="text-dim mb-6">
          {error.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
