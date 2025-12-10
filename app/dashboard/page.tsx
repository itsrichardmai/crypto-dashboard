'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTopCryptos } from '@/lib/coingecko';
import type { CryptoAsset } from '@/types/crypto';
import CoinCard from '@/components/crypto/CoinCard';
import Navbar from '@/components/layout/Navbar';
import ExploreCrypto from '@/components/crypto/ExploreCrypto';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchCryptos = async () => {
      setIsLoading(true);
      const data = await getTopCryptos(12);
      setCryptos(data);
      setIsLoading(false);
    };

    if (user) {
      fetchCryptos();
    }
  }, [user]);

  if (loading || !user) {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50">
      <Navbar />
    <div className="mb-8">
    </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cryptocurrency Market
          </h1>
          <p className="text-gray-600">
            Live prices and market data
          </p>
        </div>

        <ExploreCrypto />

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Crypto Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading market data...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredCryptos.length} cryptocurrencies
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <div className="text-xl text-gray-600">No cryptocurrencies found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}