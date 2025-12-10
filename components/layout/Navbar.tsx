'use client';

import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CryptoDash
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium">
              Market
            </Link>
            <Link href="/portfolio" className="text-gray-700 hover:text-indigo-600 font-medium">
              Portfolio
            </Link>
            
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}