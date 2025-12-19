'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTopCryptos } from '@/lib/coingecko';
import type { CryptoAsset } from '@/types/crypto';
import CoinCard from '@/components/crypto/CoinCard';
import Navbar from '@/components/layout/Navbar';
// import ExploreCrypto from '@/components/crypto/ExploreCrypto'; // REMOVED - causing infinite loop
import DemoBanner from '@/components/DemoBanner';
import { DEMO_CRYPTOS } from '@/lib/demoData';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo mode on mount only
    if (typeof window !== 'undefined') {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      setIsDemoMode(demoMode);
    }
  }, []); // Empty dependency array - run once on mount

  useEffect(() => {
    const fetchCryptos = async () => {
      if (isDemoMode) {
        // Use demo data
        setIsLoading(true);
        setCryptos(DEMO_CRYPTOS);
        setIsLoading(false);
      } else if (user) {
        // Fetch real data for logged-in users
        setIsLoading(true);
        const data = await getTopCryptos(12);
        setCryptos(data);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchCryptos();
  }, [user, isDemoMode]);

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Demo Banner */}
        {isDemoMode && <DemoBanner />}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Cryptocurrency Market
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isDemoMode ? 'Demo data - Sign up to see live prices' : 'Live prices and market data'}
          </p>
        </div>

        {/* ExploreCrypto removed temporarily - was causing infinite loop */}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Crypto Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg sm:text-xl text-gray-600">Loading market data...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-xs sm:text-sm text-gray-600">
              Showing {filteredCryptos.length} cryptocurrencies
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCryptos.map((crypto) => (
                <CoinCard
                  key={crypto.id}
                  id={crypto.id}
                  symbol={crypto.symbol}
                  name={crypto.name}
                  image={crypto.image}
                  current_price={crypto.current_price}
                  price_change_percentage_24h={crypto.price_change_percentage_24h}
                  market_cap={crypto.market_cap}
                  market_cap_rank={crypto.market_cap_rank}
                />
              ))}
            </div>

            {filteredCryptos.length === 0 && (
              <div className="text-center py-12">
                <div className="text-lg sm:text-xl text-gray-600">No cryptocurrencies found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
