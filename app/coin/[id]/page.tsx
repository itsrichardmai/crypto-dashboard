'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { getCryptoDetails } from '@/lib/coingecko';
import CoinTabs from '@/components/crypto/CoinTabs';
import PriceChart from '@/components/crypto/PriceChart';
import NewsSection from '@/components/crypto/NewsSection';
import PriceHistoryTable from '@/components/crypto/PriceHistoryTable';

export default function CoinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [coin, setCoin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (params.id) {
        setIsLoading(true);
        const data = await getCryptoDetails(params.id as string);
        setCoin(data);
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCoinData();
    }
  }, [params.id, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isLoading || !coin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-white">Loading coin data...</div>
        </div>
      </div>
    );
  }

  const priceChange24h = coin.market_data?.price_change_percentage_24h || 0;
  const isPositive = priceChange24h >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
            {/* Market Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-1">Market Cap</div>
                <div className="text-xl font-bold text-gray-900">
                ${(coin.market_data?.market_cap?.usd / 1e9).toFixed(2)}B
                </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-1">24h Volume</div>
                <div className="text-xl font-bold text-gray-900">
                ${(coin.market_data?.total_volume?.usd / 1e9).toFixed(2)}B
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-1">Circulating Supply</div>
                <div className="text-xl font-bold text-gray-900">
                {(coin.market_data?.circulating_supply / 1e6).toFixed(2)}M
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-1">All-Time High</div>
                <div className="text-xl font-bold text-gray-900">
                ${coin.market_data?.ath?.usd?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                {new Date(coin.market_data?.ath_date?.usd).toLocaleDateString()}
                </div>
            </div>
            </div>
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={coin.image?.large} alt={coin.name} className="w-16 h-16" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-600 uppercase font-medium">{coin.symbol}</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  Rank #{coin.market_cap_rank}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                ${coin.market_data?.current_price?.usd?.toLocaleString()}
              </div>
              <div className={`text-xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <CoinTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Price Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Price Chart</h3>
              <PriceChart coinId={params.id as string} />
            </div>
            <PriceHistoryTable coinId={params.id as string} />
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                About {coin.name}
              </h3>
              
              {coin.description?.en ? (
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: coin.description.en }}
                />
              ) : (
                <p className="text-gray-600">No description available.</p>
              )}
            </div>
          </div>
        )}
            {activeTab === 'news' && (
            <NewsSection coinSymbol={coin.symbol} />
            )}
            {activeTab === 'analysis' && (
    <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Analysis</h2>
        
        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
            AI Analysis Coming Soon
        </h3>
        <p className="text-gray-600 mb-4">
            Get instant AI-powered insights about {coin.name} including:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
            <li>✅ Technical analysis summary</li>
            <li>✅ Market sentiment evaluation</li>
            <li>✅ Risk assessment (1-10 scale)</li>
            <li>✅ Key support and resistance levels</li>
            <li>✅ Volume analysis</li>
        </ul>
      <p className="text-sm text-gray-500 mt-6">
        This feature will be available in Week 7-8
      </p>
    </div>
  </div>
)}
{activeTab === 'forecast' && (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Forecast</h2>
    
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Historical Pattern Forecasting
      </h3>
      <p className="text-gray-600 mb-4">
        Our algorithm analyzes historical patterns to forecast potential outcomes:
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
        <li>📊 Probability distribution (Bullish/Bearish/Neutral)</li>
        <li>📈 Expected price ranges (Best/Likely/Worst case)</li>
        <li>⭐ Confidence score & robustness rating</li>
        <li>📅 Similar historical events & outcomes</li>
        <li>⚠️ Risk assessment (1-10 scale)</li>
      </ul>
      <p className="text-sm text-gray-500 mt-6">
        Full documentation: ALGORITHM-TECHNICAL-DOCUMENTATION.md
      </p>
      <p className="text-sm text-indigo-600 font-medium mt-2">
        Implementation: Week 7-8
      </p>
    </div>
  </div>
)}
        </div>
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center text-gray-600">
            Tabs coming next: Overview | News | AI Analysis | Predictions
          </div>
        </div>
      </div>
    </div>
  );
}