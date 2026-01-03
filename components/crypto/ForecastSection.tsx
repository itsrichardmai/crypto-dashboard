'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import axios from 'axios';
import { ForecastResult } from '@/lib/forecast';

interface ForecastSectionProps {
  coin: any;
}

export default function ForecastSection({ coin }: ForecastSectionProps) {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  const fetchForecast = async () => {
    if (!coin || !user) return;

    setIsLoading(true);
    setError(null);
    setTrialExpired(false);

    try {
      const response = await axios.post('/api/forecast', {
        coinId: coin.id,
        coinName: coin.name,
        symbol: coin.symbol,
        marketData: coin.market_data,
        userId: user.uid,
      });
      setForecast(response.data.forecast);
      setIsCached(response.data.cached);
    } catch (err: any) {
      console.error('Failed to fetch forecast:', err);
      if (err.response?.data?.trialExpired) {
        setTrialExpired(true);
      } else {
        setError(err.response?.data?.error || 'Failed to generate forecast.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPercentColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Auth required
  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 text-sm mb-4">
            Price forecasts require authentication. Create a free account to access one complimentary forecast.
          </p>
          <div className="flex justify-center gap-3">
            <a href="/auth/signup" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
              Create Account
            </a>
            <a href="/auth/login" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50">
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Trial expired
  if (trialExpired) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Free Trial Used</h2>
          <p className="text-gray-600 text-sm mb-4">
            Upgrade to premium for unlimited price forecasts.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  // Initial state
  if (!forecast && !isLoading && !error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Price Forecast</h2>
          <p className="text-gray-600 text-sm mb-4">
            Generate statistical price predictions for {coin.name} based on historical data, technical indicators, and market research.
          </p>
          <p className="text-xs text-green-600 mb-4">1 free forecast available</p>
          <button
            onClick={fetchForecast}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Generate Forecast
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Generating forecast for {coin.name}...</p>
          <p className="text-gray-400 text-xs mt-1">Analyzing 90 days of data</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchForecast}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate upside from current to average target
  const avgTarget = forecast!.timeframes.mediumTerm.priceTargets.average;
  const upside = ((avgTarget - forecast!.currentPrice) / forecast!.currentPrice) * 100;

  // Results - Professional Layout
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Price Forecast</h2>
          <p className="text-xs text-gray-500">
            {isCached ? 'Cached' : 'Fresh'} • {new Date(forecast!.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={fetchForecast} className="text-sm text-blue-600 hover:text-blue-800">
          Refresh
        </button>
      </div>

      {/* Hero: Price Target */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Consensus Price Target</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(avgTarget)}
              </span>
              <span className={`text-lg font-semibold ${getPercentColor(upside)}`}>
                {formatPercent(upside)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Current: {formatPrice(forecast!.currentPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
            <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded ${
              forecast!.tradingStrategy.recommendation.includes('buy') ? 'bg-green-100 text-green-800' :
              forecast!.tradingStrategy.recommendation.includes('sell') ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {forecast!.tradingStrategy.recommendation.replace(/_/g, ' ').toUpperCase()}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              Risk/Reward: {forecast!.tradingStrategy.riskRewardRatio.toFixed(2)}:1
            </p>
          </div>
        </div>
      </div>

      {/* Price Target Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Price Targets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeframe</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Low</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">High</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Upside</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[forecast!.timeframes.shortTerm, forecast!.timeframes.mediumTerm, forecast!.timeframes.longTerm].map((tf, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{tf.label}</div>
                    <div className="text-xs text-gray-500">{tf.period}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-gray-900">{formatPrice(tf.priceTargets.low)}</div>
                    <div className={`text-xs ${getPercentColor(tf.percentageChange.low)}`}>
                      {formatPercent(tf.percentageChange.low)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-gray-900">{formatPrice(tf.priceTargets.average)}</div>
                    <div className={`text-xs ${getPercentColor(tf.percentageChange.average)}`}>
                      {formatPercent(tf.percentageChange.average)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-gray-900">{formatPrice(tf.priceTargets.high)}</div>
                    <div className={`text-xs ${getPercentColor(tf.percentageChange.high)}`}>
                      {formatPercent(tf.percentageChange.high)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${getPercentColor(tf.percentageChange.average)}`}>
                      {formatPercent(tf.percentageChange.average)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-900">{tf.confidence}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Probability Distribution */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Probability Distribution</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {[forecast!.timeframes.shortTerm, forecast!.timeframes.mediumTerm, forecast!.timeframes.longTerm].map((tf, idx) => (
              <div key={idx}>
                <p className="text-xs text-gray-500 mb-2">{tf.label}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs text-gray-600">Bullish</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${tf.probability.bullish}%` }}></div>
                    </div>
                    <div className="w-10 text-xs text-right text-gray-900">{tf.probability.bullish}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs text-gray-600">Neutral</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${tf.probability.neutral}%` }}></div>
                    </div>
                    <div className="w-10 text-xs text-right text-gray-900">{tf.probability.neutral}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs text-gray-600">Bearish</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${tf.probability.bearish}%` }}></div>
                    </div>
                    <div className="w-10 text-xs text-right text-gray-900">{tf.probability.bearish}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Levels */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Trading Levels</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Entry</p>
              <p className="font-semibold text-gray-900">{formatPrice(forecast!.tradingStrategy.entryPoint)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Stop Loss</p>
              <p className="font-semibold text-red-600">{formatPrice(forecast!.tradingStrategy.stopLoss)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Target 1</p>
              <p className="font-semibold text-green-600">{formatPrice(forecast!.tradingStrategy.takeProfit1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Target 2</p>
              <p className="font-semibold text-green-600">{formatPrice(forecast!.tradingStrategy.takeProfit2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Target 3</p>
              <p className="font-semibold text-green-600">{formatPrice(forecast!.tradingStrategy.takeProfit3)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">R/R Ratio</p>
              <p className="font-semibold text-gray-900">{forecast!.tradingStrategy.riskRewardRatio.toFixed(2)}:1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Technical Indicators</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 text-gray-600">RSI (14)</td>
                  <td className="py-2 text-right">
                    <span className={`font-medium ${
                      forecast!.technicalIndicators.rsi > 70 ? 'text-red-600' :
                      forecast!.technicalIndicators.rsi < 30 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {forecast!.technicalIndicators.rsi.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({forecast!.technicalIndicators.rsiSignal})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">MACD</td>
                  <td className="py-2 text-right">
                    <span className={`font-medium ${
                      forecast!.technicalIndicators.macdSignal === 'bullish' ? 'text-green-600' :
                      forecast!.technicalIndicators.macdSignal === 'bearish' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {forecast!.technicalIndicators.macdSignal.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Moving Averages</td>
                  <td className="py-2 text-right">
                    <span className={`font-medium ${
                      forecast!.technicalIndicators.movingAverages.signal === 'bullish' ? 'text-green-600' :
                      forecast!.technicalIndicators.movingAverages.signal === 'bearish' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {forecast!.technicalIndicators.movingAverages.signal.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Bollinger Position</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {forecast!.technicalIndicators.bollingerBands.position.toUpperCase()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Moving Averages</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 text-gray-600">MA 7</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {formatPrice(forecast!.technicalIndicators.movingAverages.ma7)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">MA 30</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {formatPrice(forecast!.technicalIndicators.movingAverages.ma30)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">MA 90</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {forecast!.technicalIndicators.movingAverages.ma90 ? formatPrice(forecast!.technicalIndicators.movingAverages.ma90) : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Bollinger Bands</td>
                  <td className="py-2 text-right text-gray-900 text-xs">
                    {formatPrice(forecast!.technicalIndicators.bollingerBands.lower)} - {formatPrice(forecast!.technicalIndicators.bollingerBands.upper)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analyst Consensus */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Analyst Consensus</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{forecast!.analystConsensus.bullishPercent}%</p>
              <p className="text-xs text-gray-500">Bullish</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{forecast!.analystConsensus.neutralPercent}%</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{forecast!.analystConsensus.bearishPercent}%</p>
              <p className="text-xs text-gray-500">Bearish</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(forecast!.analystConsensus.averageTarget)}</p>
              <p className="text-xs text-gray-500">Avg Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Market Factors</h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">BTC Correlation</p>
              <p className="text-gray-700">{forecast!.marketFactors.btcCorrelation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Market Sentiment</p>
              <p className="text-gray-700">{forecast!.marketFactors.marketSentiment}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Risk Factors</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-1 text-sm">
              {forecast!.marketFactors.riskFactors.map((risk, i) => (
                <li key={i} className="text-gray-700">• {risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase">Methodology</p>
            <p className="text-gray-700">{forecast!.statisticalModel.methodology}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Confidence</p>
            <p className="text-gray-700">{forecast!.statisticalModel.confidenceLevel}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Data Points</p>
            <p className="text-gray-700">{forecast!.statisticalModel.dataPoints}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Volatility</p>
            <p className="text-gray-700">{forecast!.statisticalModel.volatilityAdjustment}%</p>
          </div>
        </div>
      </div>

      {/* Position Sizing */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase mb-1">Position Sizing Recommendation</p>
        <p className="text-sm text-gray-700">{forecast!.tradingStrategy.positionSizing}</p>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400">
        {forecast!.disclaimer}
      </p>
    </div>
  );
}
