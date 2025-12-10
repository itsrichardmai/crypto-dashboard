import Link from 'next/link';

interface CoinCardProps {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
}

export default function CoinCard({ 
  id, symbol, name, image, current_price, 
  price_change_percentage_24h, market_cap, market_cap_rank 
}: CoinCardProps) {
  const isPositive = price_change_percentage_24h >= 0;
  
  return (
    <Link href={`/coin/${id}`}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-xl transition cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <img src={image} alt={name} className="w-10 h-10" />
          <div className="flex-1">
            <div className="font-bold text-gray-900">{name}</div>
            <div className="text-sm text-gray-500 uppercase">{symbol}</div>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
            #{market_cap_rank}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ${current_price.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              MCap: ${(market_cap / 1e9).toFixed(2)}B
            </div>
          </div>
          
          <div className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(price_change_percentage_24h).toFixed(2)}%
          </div>
        </div>
      </div>
    </Link>
  );
}