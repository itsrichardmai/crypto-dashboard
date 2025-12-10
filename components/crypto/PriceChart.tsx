'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface PriceChartProps {
  coinId: string;
}

export default function PriceChart({ coinId }: PriceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('7');
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
      }
    );

    const formattedData = response.data.prices.map((item: any) => ({
      timestamp: new Date(item[0]).toLocaleDateString(),
      price: item[1],
    }));

    setChartData(formattedData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    setChartData([]); // Set empty on error
  }
  
  setIsLoading(false);
};
    fetchChartData();
  }, [coinId, timeframe]);

  const timeframes = [
    { value: '1', label: '24H' },
    { value: '7', label: '7D' },
    { value: '30', label: '1M' },
    { value: '90', label: '3M' },
    { value: '365', label: '1Y' },
  ];

  return (
    <div>
      {/* Timeframe Buttons */}
      <div className="flex gap-2 mb-4">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeframe === tf.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tf.label}
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