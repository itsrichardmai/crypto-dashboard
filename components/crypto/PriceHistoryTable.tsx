'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface PriceHistoryTableProps {
  coinId: string;
}

type Timeframe = '1D' | '1W' | '1M' | '1Y';

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
}

export default function PriceHistoryTable({ coinId }: PriceHistoryTableProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1W');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);

      try {
        // Use API route to avoid CORS issues
        const response = await axios.get(
          `/api/market-chart/${coinId}?days=${getDays(timeframe)}`
        );

        const prices = response.data.prices;
        const formatted = formatPriceData(prices, timeframe);
        setPriceData(formatted);
      } catch (error) {
        console.error('Error fetching price history:', error);
        setPriceData([]);
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, [coinId, timeframe]);

  const getDays = (tf: Timeframe): number => {
    switch (tf) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '1Y': return 365;
      default: return 7;
    }
  };

  const formatPriceData = (prices: [number, number][], tf: Timeframe): PriceData[] => {
    if (!prices || prices.length === 0) return [];

    // For 1D, limit to 10 data points; for others, divide into ~10 intervals
    const targetPoints = 10;
    const interval = Math.max(1, Math.floor(prices.length / targetPoints));
    const data: PriceData[] = [];

    for (let i = 0; i < prices.length; i += interval) {
      const chunk = prices.slice(i, Math.min(i + interval, prices.length));
      if (chunk.length === 0) continue;

      const open = chunk[0][1];
      const close = chunk[chunk.length - 1][1];
      const high = Math.max(...chunk.map(p => p[1]));
      const low = Math.min(...chunk.map(p => p[1]));
      const change = ((close - open) / open) * 100;

      data.push({
        date: new Date(chunk[0][0]).toLocaleDateString(),
        open,
        high,
        low,
        close,
        change,
      });
    }

    return data.reverse();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Price History</h3>
        
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['1D', '1W', '1M', '1Y'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Loading price history...</div>
      ) : priceData.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>Price history temporarily unavailable</p>
          <p className="text-sm mt-2">Please try again in a moment</p>
        </div>
      ) : (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Low
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {row.date}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                    ${row.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-green-600">
                    ${row.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-red-600">
                    ${row.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                    ${row.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-semibold ${
                    row.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
