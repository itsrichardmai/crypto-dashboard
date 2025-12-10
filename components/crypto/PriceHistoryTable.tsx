'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface PriceHistoryTableProps {
  coinId: string;
}

interface HistoryRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
}

export default function PriceHistoryTable({ coinId }: PriceHistoryTableProps) {
  const [timeframe, setTimeframe] = useState<'1' | '7' | '30' | '365'>('7');
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      
      try {
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: timeframe,
              interval: timeframe === '1' ? 'hourly' : 'daily',
            },
          }
        );

        // Process data into OHLC format
        const prices = response.data.prices;
        const rows: HistoryRow[] = [];

        if (timeframe === '1') {
          // For 1 day, group by hour (24 hours)
          for (let i = 0; i < prices.length; i += 4) {
            const chunk = prices.slice(i, i + 4);
            if (chunk.length > 0) {
              const priceValues = chunk.map((p: any) => p[1]);
              const open = priceValues[0];
              const close = priceValues[priceValues.length - 1];
              const high = Math.max(...priceValues);
              const low = Math.min(...priceValues);
              const change = ((close - open) / open) * 100;

              rows.push({
                date: new Date(chunk[0][0]).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                open,
                high,
                low,
                close,
                change,
              });
            }
          }
        } else {
          // For longer periods, group by day
          const dailyData: { [key: string]: number[] } = {};
          
          prices.forEach((price: any) => {
            const date = new Date(price[0]).toLocaleDateString();
            if (!dailyData[date]) {
              dailyData[date] = [];
            }
            dailyData[date].push(price[1]);
          });

          Object.entries(dailyData).forEach(([date, priceValues]) => {
            if (priceValues.length > 0) {
              const open = priceValues[0];
              const close = priceValues[priceValues.length - 1];
              const high = Math.max(...priceValues);
              const low = Math.min(...priceValues);
              const change = ((close - open) / open) * 100;

              rows.push({
                date,
                open,
                high,
                low,
                close,
                change,
              });
            }
          });
        }

        // Reverse to show most recent first
        setHistoryData(rows.reverse());
      } catch (error) {
        console.error('Error fetching price history:', error);
        setHistoryData([]);
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, [coinId, timeframe]);

  const timeframes = [
    { value: '1', label: '1D' },
    { value: '7', label: '1W' },
    { value: '30', label: '1M' },
    { value: '365', label: '1Y' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Price History</h3>
        
        {/* Timeframe Buttons */}
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                timeframe === tf.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-600">
          <div className="animate-pulse">Loading price history...</div>
        </div>
      ) : historyData.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No historical data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Open
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  High
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Low
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Close
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  % Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historyData.map((row, index) => {
                const isPositive = row.change >= 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${row.open.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: row.open < 1 ? 6 : 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      ${row.high.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: row.high < 1 ? 6 : 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      ${row.low.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: row.low < 1 ? 6 : 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      ${row.close.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: row.close < 1 ? 6 : 2,
                      })}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}{row.change.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
