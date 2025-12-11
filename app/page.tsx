import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 p-4">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-6xl font-bold text-white">
          Crypto Trading Dashboard
        </h1>
        <p className="text-xl text-purple-200">
          Professional crypto analysis, paper trading, and portfolio management - completely free
        </p>
        <div className="flex gap-4 justify-center pt-4">
        <Link href="/auth/login">
          <Button size="lg" className="text-lg px-8">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="lg" variant="outline" className="text-lg px-8">
            Get Started Free
          </Button>
        </Link>
        </div>
      </div>
    </div>
  );
}