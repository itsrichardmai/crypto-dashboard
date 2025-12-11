'use client';

import { useEffect, useState } from 'react';
import { getTopCryptos } from '@/lib/coingecko';
import axios from 'axios';
import Link from 'next/link';
import type { CryptoAsset } from '@/types/crypto';

export default function ExploreCrypto() {
  const [activeCategory, setActiveCategory] = useState<'popular' | 'gainers' | 'losers' | 'stablecoins'>('popular');
  const [coins, setCoins] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      setIsLoading(true);
      let data: CryptoAsset[] = [];

      try {
        // Get top 100 coins once
        const allCoins = await getTopCryptos(100);

        switch (activeCategory) {
  case 'popular':
    // Top 12 by market cap
    data = allCoins.slice(0, 12);
    break;

  case 'gainers':
    // Top 12 gainers in 24h
    data = allCoins
      .filter(c => c.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 12);
    break;

  case 'losers':
    // Top 12 losers in 24h
    data = allCoins
      .filter(c => c.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 12);
    break;

  case 'stablecoins':
    // Filter stablecoins from already loaded data
    data = allCoins.filter(c => 
      ['usdt', 'usdc', 'dai', 'busd', 'tusd'].includes(c.symbol.toLowerCase())
    );
    break;
}

        setCoins(data);
      } catch (error) {
        console.error('Error fetching coins:', error);
      }

      setIsLoading(false);
    };

    fetchCoins();
  }, [activeCategory]);

const categories = [
  { id: 'popular', label: 'Popular', icon: '🔥' },
  { id: 'gainers', label: 'Top Gainers', icon: '📈' },
  { id: 'losers', label: 'Top Losers', icon: '📉' },
  { id: 'stablecoins', label: 'Stablecoins', icon: '💵' },
];

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Crypto</h2>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Coins Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {coins.map((coin) => {
            const isPositive = coin.price_change_percentage_24h >= 0;
            
            return (
              <Link key={coin.id} href={`/coin/${coin.id}`}>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-indigo-300 transition cursor-pointer">
                  <div className="flex items-center gap-2 mb-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate text-sm">
                        {coin.name}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="text-lg font-bold text-gray-900 mb-1">
                    ${coin.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: coin.current_price < 1 ? 6 : 2,
                    })}
                  </div>

                  <div className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </div>

                  {activeCategory === 'popular' && (
                    <div className="text-xs text-gray-500 mt-2">
                      Vol: ${(coin.total_volume / 1e9).toFixed(2)}B
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
