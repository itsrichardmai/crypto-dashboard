'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 p-4">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-bold text-white">
          Crypto Trading Dashboard
        </h1>
        <p className="text-lg sm:text-xl text-purple-200">
          Professional crypto analysis, paper trading, and portfolio management - completely free
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/auth/login">
            <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}