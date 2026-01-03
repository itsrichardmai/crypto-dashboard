'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface GlobalData {
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: { btc: number; eth: number };
}

export default function MarketStats() {
  const [data, setData] = useState<GlobalData | null>(null);

  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        // Use API route to avoid CORS issues
        const response = await axios.get('/api/global');
        setData({
          total_market_cap: response.data.data.total_market_cap.usd,
          total_volume: response.data.data.total_volume.usd,
          market_cap_percentage: response.data.data.market_cap_percentage,
        });
      } catch (error) {
        console.error('Error fetching global data:', error);
      }
    };

    fetchGlobal();
  }, []);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-1">Total Market Cap</div>
        <div className="text-2xl font-bold text-gray-900">
          ${(data.total_market_cap / 1e12).toFixed(2)}T
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-1">24h Volume</div>
        <div className="text-2xl font-bold text-gray-900">
          ${(data.total_volume / 1e9).toFixed(2)}B
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-1">BTC Dominance</div>
        <div className="text-2xl font-bold text-gray-900">
          {data.market_cap_percentage.btc.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}