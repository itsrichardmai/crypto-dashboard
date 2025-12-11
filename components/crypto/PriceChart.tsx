'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PriceChartProps {
  coinId: string;
}

const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

const getHeaders = () => {
  return API_KEY ? {
    'x-cg-demo-api-key': API_KEY
  } : {};
};

export default function PriceChart({ coinId }: PriceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<string>('7');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      
      try {
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: timeframe,
            },
            headers: getHeaders(),
          }
        );

        const formattedData = response.data.prices.map((item: any) => ({
          timestamp: new Date(item[0]).toLocaleDateString(),
          price: item[1],
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
      }
      
      setIsLoading(false);
    };

    fetchChartData();
  }, [coinId, timeframe]);

  return (
    <div>
      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {['1', '7', '30', '365'].map((days) => (
          <button
            key={days}
            onClick={() => setTimeframe(days)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeframe === days
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {days === '1' ? '1D' : days === '7' ? '1W' : days === '30' ? '1M' : '1Y'}
          </button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-600">Loading chart...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-600">
            <p>Chart temporarily unavailable</p>
            <p className="text-sm mt-2">Please refresh in a moment</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4f46e5" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
