'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { getUserBalance, getUserHoldings, getUserTransactions } from '@/lib/portfolio';
import { EXCHANGES } from '@/lib/exchangeFees';
import { getCryptoPrice } from '@/lib/coingecko';
import type { Holding, Transaction } from '@/lib/portfolio';

// Symbol mapping
const SYMBOL_TO_ID: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
  'SOL': 'solana', 'USDC': 'usd-coin', 'XRP': 'ripple', 'ADA': 'cardano',
  'DOGE': 'dogecoin', 'TRX': 'tron', 'AVAX': 'avalanche-2', 'SHIB': 'shiba-inu',
  'DOT': 'polkadot', 'LINK': 'chainlink', 'MATIC': 'matic-network', 'LTC': 'litecoin',
  'BCH': 'bitcoin-cash', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'XLM': 'stellar',
};

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(10000);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadPortfolioData = async () => {
      if (user) {
        setIsLoading(true);
        const userBalance = await getUserBalance(user.uid);
        setBalance(userBalance);

        const userHoldings = await getUserHoldings(user.uid);
        const holdingsWithPrices = await Promise.all(
          userHoldings.map(async (holding) => {
            const coinId = SYMBOL_TO_ID[holding.symbol] || holding.symbol.toLowerCase();
            let price = await getCryptoPrice(coinId);
            if (!price || price === 0) price = holding.avgCostBasis;
            
            return {
              ...holding,
              currentPrice: price,
              currentValue: price * holding.quantity,
              gainLoss: (price * holding.quantity) - holding.totalCost,
              gainLossPercent: ((price * holding.quantity) - holding.totalCost) / holding.totalCost * 100,
            };
          })
        );

        setHoldings(holdingsWithPrices as any);
        const total = holdingsWithPrices.reduce((sum, h) => sum + h.currentValue, 0);
        setTotalValue(total);

        const userTransactions = await getUserTransactions(user.uid);
        setTransactions(userTransactions);
        setIsLoading(false);
      }
    };

    loadPortfolioData();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const portfolioTotal = balance + totalValue;
  const totalGainLoss = totalValue - holdings.reduce((sum, h: any) => sum + h.totalCost, 0);
  const totalGainLossPercent = holdings.reduce((sum, h: any) => sum + h.totalCost, 0) > 0
    ? (totalGainLoss / holdings.reduce((sum, h: any) => sum + h.totalCost, 0)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Cash Balance</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Holdings Value</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Portfolio</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${portfolioTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Gain/Loss</div>
            <div className={`text-2xl sm:text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-base sm:text-lg ml-2">({totalGainLossPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div className="bg-white rounded-lg shadow-lg mb-6 sm:mb-8 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Holdings</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-600">Loading holdings...</div>
          ) : holdings.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No holdings yet. Start trading to build your portfolio!
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                {holdings.map((holding: any) => (
                  <div key={holding.symbol} className="border-b border-gray-200 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{holding.name}</div>
                        <div className="text-sm text-gray-500">{holding.symbol}</div>
                      </div>
                      <div className={`text-right font-semibold ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss?.toFixed(2)}
                        <div className="text-xs">({holding.gainLossPercent?.toFixed(2)}%)</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Qty:</span> {holding.quantity.toFixed(4)}
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Cost:</span> ${holding.avgCostBasis.toFixed(2)}
                      </div>
                      <div>
                        <span className="text-gray-600">Current:</span> ${holding.currentPrice?.toFixed(2)}
                      </div>
                      <div>
                        <span className="text-gray-600">Value:</span> ${holding.currentValue?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holdings.map((holding: any) => (
                      <tr key={holding.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{holding.name}</div>
                          <div className="text-sm text-gray-500">{holding.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {holding.quantity.toFixed(8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ${holding.avgCostBasis.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ${holding.currentPrice?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${holding.currentValue?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className={`font-semibold ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss?.toFixed(2)}
                          </div>
                          <div className={`text-xs ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({holding.gainLossPercent?.toFixed(2)}%)
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Transaction History - Scrollable on mobile */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Transaction History</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-600">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Price</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Fee</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {tx.timestamp.toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          tx.action === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <div className="font-medium text-gray-900">{tx.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                        {tx.quantity.toFixed(4)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        ${tx.price.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm text-orange-600 hidden md:table-cell">
                        ${tx.fee?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium text-gray-900">
                        ${tx.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
