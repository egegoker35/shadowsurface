'use client';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import VerifyContent from './VerifyContent';

export default function VerifyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 px-4 max-w-md mx-auto text-center">
        <Suspense fallback={
          <div className="bg-ink2 border border-cream/12 rounded-xl p-8 shadow-xl">
            <p className="text-dim">Verifying your email...</p>
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}
