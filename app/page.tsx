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
    // If user is logged in OR in demo mode, redirect to dashboard
    if (!loading) {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';
      
      if (user || isDemoMode) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleDemo = () => {
    localStorage.setItem('demoMode', 'true');
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't show landing page if user is logged in or in demo
  if (user) {
    return null;
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
          <Button 
            size="lg" 
            onClick={handleDemo}
            className="text-lg px-8 w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            Try Demo (No Sign Up)
          </Button>
          
          <Link href="/auth/signup" className="w-full sm:w-auto">
            <Button size="lg" className="text-lg px-8 w-full bg-indigo-600 hover:bg-indigo-700">
              Get Started Free
            </Button>
          </Link>
          
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 w-full border-2 border-white text-white hover:bg-white hover:text-slate-900 bg-transparent"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-purple-300 text-sm">
          <p>✨ No credit card required • ✨ $10,000 virtual money • ✨ Real-time charts</p>
        </div>
      </div>
    </div>
  );
}
