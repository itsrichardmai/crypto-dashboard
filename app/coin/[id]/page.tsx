'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getCryptoDetails } from '@/lib/coingecko';
import Navbar from '@/components/layout/Navbar';
import CoinTabs from '@/components/crypto/CoinTabs';
import TradingViewChart from '@/components/crypto/TradingViewChart';
import NewsSection from '@/components/crypto/NewsSection';
import AboutSection from '@/components/crypto/AboutSection';
import PriceHistoryTable from '@/components/crypto/PriceHistoryTable';
import AIAnalysisSection from '@/components/crypto/AIAnalysisSection';
import ForecastSection from '@/components/crypto/ForecastSection';
import TradeModal from '@/components/portfolio/TradeModal';
import { Button } from '@/components/ui/button';
import { getUserBalance, getUserHoldings, executeBuyWithFees, executeSellWithFees } from '@/lib/portfolio';

export default function CoinDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [coin, setCoin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'ai-analysis' | 'forecast'>('overview');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(10000);
  const [userHoldings, setUserHoldings] = useState(0);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (params.id) {
        setIsLoading(true);
        const data = await getCryptoDetails(params.id as string);
        setCoin(data);
        setIsLoading(false);
      }
    };

    fetchCoinData();
  }, [params.id]);

  useEffect(() => {
    const loadPortfolioData = async () => {
      if (user) {
        const balance = await getUserBalance(user.uid);
        setUserBalance(balance);
        
        const holdings = await getUserHoldings(user.uid);
        const holding = holdings.find(h => h.symbol === coin?.symbol?.toUpperCase());
        setUserHoldings(holding?.quantity || 0);
      }
    };

    if (coin && user) {
      loadPortfolioData();
    }
  }, [user, coin]);

  const handleTrade = async (
    action: 'BUY' | 'SELL',
    quantity: number,
    orderType: 'market' | 'limit',
    exchange: string
  ) => {
    if (!user || !coin) return;

    const result = action === 'BUY'
      ? await executeBuyWithFees(
          user.uid,
          coin.symbol.toUpperCase(),
          coin.name,
          quantity,
          coin.market_data.current_price.usd,
          orderType,
          exchange
        )
      : await executeSellWithFees(
          user.uid,
          coin.symbol.toUpperCase(),
          coin.name,
          quantity,
          coin.market_data.current_price.usd,
          orderType,
          exchange
        );

    if (result.success) {
      // Refresh data
      const balance = await getUserBalance(user.uid);
      setUserBalance(balance);
      
      const holdings = await getUserHoldings(user.uid);
      const holding = holdings.find(h => h.symbol === coin.symbol.toUpperCase());
      setUserHoldings(holding?.quantity || 0);
      
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-2xl">Coin not found</div>
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
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={coin.image?.large}
                alt={coin.name}
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-600 uppercase">{coin.symbol}</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    Rank #{coin.market_cap_rank}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                ${coin.market_data?.current_price?.usd?.toLocaleString()}
              </div>
              <div className={`text-xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}%
              </div>
              {user && (
                <Button 
                  onClick={() => setIsTradeModalOpen(true)}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                >
                  Trade
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Market Cap</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(coin.market_data?.market_cap?.usd / 1e9).toFixed(2)}B
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(coin.market_data?.total_volume?.usd / 1e9).toFixed(2)}B
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Circulating Supply</div>
            <div className="text-2xl font-bold text-gray-900">
              {(coin.market_data?.circulating_supply / 1e9).toFixed(2)}B
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">All-Time High</div>
            <div className="text-2xl font-bold text-gray-900">
              ${coin.market_data?.ath?.usd?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Price History Table */}
        <div className="mb-8">
          <PriceHistoryTable coinId={params.id as string} />
        </div>

        {/* Tab Navigation */}
        <CoinTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Price Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Price Chart</h3>
                <TradingViewChart symbol={coin.symbol} />
              </div>

              {/* About Section */}
              <AboutSection coin={coin} />
            </div>
          )}

          {activeTab === 'news' && (
            <NewsSection coinSymbol={coin.symbol} coinName={coin.name} />
          )}

          {activeTab === 'ai-analysis' && (
            <AIAnalysisSection coin={coin} />
          )}

          {activeTab === 'forecast' && (
            <ForecastSection coin={coin} />
          )}
        </div>
      </div>

      {/* Trade Modal */}
      {user && (
        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          coinId={params.id as string}
          coinName={coin.name}
          coinSymbol={coin.symbol}
          currentPrice={coin.market_data.current_price.usd}
          userBalance={userBalance}
          userHoldings={userHoldings}
          userId={user.uid}
          onTrade={handleTrade}
        />
      )}
    </div>
  );
}
