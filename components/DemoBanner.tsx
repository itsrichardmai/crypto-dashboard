'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DemoBanner() {
  const router = useRouter();

  const handleSignUp = () => {
    localStorage.removeItem('demoMode');
    router.push('/auth/signup');
  };

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-l-4 border-yellow-600 p-4 mb-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <p className="font-bold text-gray-900 text-lg">Demo Mode</p>
            <p className="text-gray-800 text-sm">
              You're using demo data. Sign up to save your trades and portfolio!
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSignUp}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 whitespace-nowrap"
        >
          Create Free Account
        </Button>
      </div>
    </div>
  );
}
