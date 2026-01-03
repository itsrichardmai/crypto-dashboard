'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import axios from 'axios';
import { AIAnalysisResult, CoinMarketData } from '@/lib/perplexity';

interface AIAnalysisSectionProps {
  coin: any;
}

export default function AIAnalysisSection({ coin }: AIAnalysisSectionProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  const fetchAnalysis = async () => {
    if (!coin || !user) return;

    setIsLoading(true);
    setError(null);
    setTrialExpired(false);

    try {
      const coinData: CoinMarketData = {
        name: coin.name,
        symbol: coin.symbol,
        currentPrice: coin.market_data?.current_price?.usd || 0,
        priceChange24h: coin.market_data?.price_change_percentage_24h || 0,
        priceChange7d: coin.market_data?.price_change_percentage_7d || 0,
        priceChange30d: coin.market_data?.price_change_percentage_30d || 0,
        marketCap: coin.market_data?.market_cap?.usd || 0,
        volume24h: coin.market_data?.total_volume?.usd || 0,
        circulatingSupply: coin.market_data?.circulating_supply || 0,
        totalSupply: coin.market_data?.total_supply || null,
        maxSupply: coin.market_data?.max_supply || null,
        ath: coin.market_data?.ath?.usd || 0,
        athDate: coin.market_data?.ath_date?.usd || '',
        atl: coin.market_data?.atl?.usd || 0,
        atlDate: coin.market_data?.atl_date?.usd || '',
        marketCapRank: coin.market_cap_rank || 0,
      };

      const response = await axios.post('/api/analysis', { coinData, userId: user.uid });
      setAnalysis(response.data.analysis);
      setIsCached(response.data.cached);
    } catch (err: any) {
      console.error('Failed to fetch analysis:', err);
      if (err.response?.data?.trialExpired) {
        setTrialExpired(true);
        setError('Free trial used. Upgrade to premium for unlimited analysis.');
      } else {
        setError(err.response?.data?.error || 'Failed to generate analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercent = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  // Auth required
  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 text-sm mb-4">
            AI-powered analysis requires authentication. Create a free account to access one complimentary analysis.
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
            Upgrade to premium for unlimited AI analysis access.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  // Initial state
  if (!analysis && !isLoading && !error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Research Analysis</h2>
          <p className="text-gray-600 text-sm mb-4">
            Generate comprehensive fundamental and technical analysis for {coin.name} using real-time market research.
          </p>
          <p className="text-xs text-green-600 mb-4">1 free analysis available</p>
          <button
            onClick={fetchAnalysis}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Generate Analysis
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
          <p className="text-gray-600 text-sm">Researching {coin.name}...</p>
          <p className="text-gray-400 text-xs mt-1">This may take 15-30 seconds</p>
        </div>
      </div>
    );
  }

  // Error
  if (error && !trialExpired) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const getRatingBg = (rating: string) => {
    if (rating?.includes('buy')) return 'bg-green-100 text-green-800';
    if (rating?.includes('sell')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'bullish') return 'text-green-600';
    if (trend === 'bearish') return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment?.includes('bullish')) return 'text-green-600';
    if (sentiment?.includes('bearish')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRiskColor = (level: string) => {
    if (level === 'low') return 'text-green-600';
    if (level === 'high' || level === 'very_high') return 'text-red-600';
    return 'text-yellow-600';
  };

  // Results - Professional Layout
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fundamental Analysis</h2>
          <p className="text-xs text-gray-500">
            {isCached ? 'Cached' : 'Fresh'} | {new Date(analysis!.lastUpdated).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={fetchAnalysis}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 leading-relaxed">{analysis!.executiveSummary}</p>
      </div>

      {/* Analyst Consensus - Hero Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rating</p>
            <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded ${getRatingBg(analysis!.analystConsensus?.rating)}`}>
              {analysis!.analystConsensus?.rating?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
            </span>
            <p className="text-xs text-gray-500 mt-2">{analysis!.analystConsensus?.timeframe}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bear Case</p>
            <p className="text-lg font-semibold text-red-600">{analysis!.analystConsensus?.priceTargets?.bearCase?.price || 'N/A'}</p>
            <p className="text-xs text-gray-500">{formatPercent(analysis!.analystConsensus?.priceTargets?.bearCase?.probability)} prob</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Base Case</p>
            <p className="text-lg font-semibold text-gray-900">{analysis!.analystConsensus?.priceTargets?.baseCase?.price || 'N/A'}</p>
            <p className="text-xs text-gray-500">{formatPercent(analysis!.analystConsensus?.priceTargets?.baseCase?.probability)} prob</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bull Case</p>
            <p className="text-lg font-semibold text-green-600">{analysis!.analystConsensus?.priceTargets?.bullCase?.price || 'N/A'}</p>
            <p className="text-xs text-gray-500">{formatPercent(analysis!.analystConsensus?.priceTargets?.bullCase?.probability)} prob</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sources</p>
            <div className="text-xs text-gray-600">
              {analysis!.analystConsensus?.sources?.slice(0, 3).map((s, i) => (
                <span key={i} className="block truncate">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trend</p>
          <p className={`text-sm font-semibold ${getTrendColor(analysis!.technicalAnalysis?.trend)}`}>
            {analysis!.technicalAnalysis?.trend?.toUpperCase() || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">{analysis!.technicalAnalysis?.trendStrength}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sentiment</p>
          <p className={`text-sm font-semibold ${getSentimentColor(analysis!.marketSentiment?.overall)}`}>
            {analysis!.marketSentiment?.overall?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fear/Greed</p>
          <p className="text-sm font-semibold text-gray-900">{analysis!.marketSentiment?.fearGreedIndex || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Risk Level</p>
          <p className={`text-sm font-semibold ${getRiskColor(analysis!.riskAssessment?.level)}`}>
            {analysis!.riskAssessment?.level?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volatility</p>
          <p className="text-sm font-semibold text-gray-900">{analysis!.riskAssessment?.volatilityScore}/10</p>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Technical Indicators</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">RSI (14)</p>
              <p className="font-semibold">{analysis!.technicalAnalysis?.indicators?.rsi?.value || 'N/A'}</p>
              <p className="text-xs text-gray-500">{analysis!.technicalAnalysis?.indicators?.rsi?.signal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">MACD</p>
              <p className={`font-semibold ${analysis!.technicalAnalysis?.indicators?.macd?.signal === 'bullish' ? 'text-green-600' : analysis!.technicalAnalysis?.indicators?.macd?.signal === 'bearish' ? 'text-red-600' : 'text-gray-900'}`}>
                {analysis!.technicalAnalysis?.indicators?.macd?.signal?.toUpperCase() || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">{analysis!.technicalAnalysis?.indicators?.macd?.histogram}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">EMA Cross</p>
              <p className="font-semibold text-gray-900">{analysis!.technicalAnalysis?.indicators?.ema?.crossover || 'None'}</p>
              <p className="text-xs text-gray-500">50: {analysis!.technicalAnalysis?.indicators?.ema?.ema50}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Bollinger</p>
              <p className="font-semibold text-gray-900">{analysis!.technicalAnalysis?.indicators?.bollingerBands?.position || 'N/A'}</p>
              <p className="text-xs text-gray-500">{analysis!.technicalAnalysis?.indicators?.bollingerBands?.bandwidth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support/Resistance Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-green-700">Support Levels</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {analysis!.technicalAnalysis?.supportLevels?.map((level, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-gray-900">{level.price}</td>
                    <td className="py-2 text-right text-gray-600 text-xs">{level.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-red-700">Resistance Levels</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {analysis!.technicalAnalysis?.resistanceLevels?.map((level, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-gray-900">{level.price}</td>
                    <td className="py-2 text-right text-gray-600 text-xs">{level.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart Patterns */}
      {analysis!.technicalAnalysis?.patterns?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Chart Patterns</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Probability</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analysis!.technicalAnalysis?.patterns?.map((pattern, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-900">{pattern.name}</td>
                    <td className="py-2 text-right text-gray-600">{pattern.probability}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{pattern.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fundamental Analysis */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Tokenomics & Network Metrics</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Supply Dynamics</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.tokenomics?.supply || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Distribution</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.tokenomics?.distribution || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Inflation/Burn</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.tokenomics?.inflationBurn || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">TVL</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.networkMetrics?.tvl || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Active Addresses</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.networkMetrics?.activeAddresses || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Developer Activity</p>
                <p className="text-gray-700">{analysis!.fundamentalAnalysis?.networkMetrics?.developerActivity || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Adoption & Partnerships</h3>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Corporate Integrations</p>
            <div className="flex flex-wrap gap-2">
              {analysis!.fundamentalAnalysis?.adoption?.corporateIntegrations?.map((corp, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{corp}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Institutional Holdings</p>
            <p className="text-gray-700">{analysis!.fundamentalAnalysis?.adoption?.institutionalHoldings || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Key Partnerships</p>
            <ul className="space-y-1">
              {analysis!.fundamentalAnalysis?.adoption?.partnerships?.map((p, i) => (
                <li key={i} className="text-gray-700">- {p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-green-700">Strengths</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm">
              {analysis!.fundamentalAnalysis?.strengths?.map((s, i) => (
                <li key={i} className="text-gray-700">- {s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-red-700">Weaknesses</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm">
              {analysis!.fundamentalAnalysis?.weaknesses?.map((w, i) => (
                <li key={i} className="text-gray-700">- {w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Market Sentiment</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Social Volume</p>
              <p className="text-gray-700">{analysis!.marketSentiment?.socialVolume || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Institutional Flow</p>
              <p className="text-gray-700">{analysis!.marketSentiment?.institutionalFlow || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Retail Activity</p>
              <p className="text-gray-700">{analysis!.marketSentiment?.retailActivity || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">News Impact</p>
              <p className="text-gray-700">{analysis!.marketSentiment?.newsImpact || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Insights */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Trading Insights</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Short-Term (1-7d)</p>
              <p className="text-gray-700 mb-2">{analysis!.tradingInsights?.shortTerm?.outlook || 'N/A'}</p>
              <p className="text-xs text-gray-500 mb-1">Strategy</p>
              <p className="text-gray-600 text-xs">{analysis!.tradingInsights?.shortTerm?.strategy || 'N/A'}</p>
              {analysis!.tradingInsights?.shortTerm?.keyLevels?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Key Levels</p>
                  {analysis!.tradingInsights?.shortTerm?.keyLevels?.map((level, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{level}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Medium-Term (1-4w)</p>
              <p className="text-gray-700 mb-2">{analysis!.tradingInsights?.mediumTerm?.outlook || 'N/A'}</p>
              <p className="text-xs text-gray-500 mb-1">Strategy</p>
              <p className="text-gray-600 text-xs">{analysis!.tradingInsights?.mediumTerm?.strategy || 'N/A'}</p>
              {analysis!.tradingInsights?.mediumTerm?.keyLevels?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Key Levels</p>
                  {analysis!.tradingInsights?.mediumTerm?.keyLevels?.map((level, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{level}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Long-Term (1-6m)</p>
              <p className="text-gray-700 mb-2">{analysis!.tradingInsights?.longTerm?.outlook || 'N/A'}</p>
              <p className="text-xs text-gray-500 mb-1">Strategy</p>
              <p className="text-gray-600 text-xs">{analysis!.tradingInsights?.longTerm?.strategy || 'N/A'}</p>
              {analysis!.tradingInsights?.longTerm?.keyLevels?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Key Levels</p>
                  {analysis!.tradingInsights?.longTerm?.keyLevels?.map((level, i) => (
                    <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{level}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Risk Assessment</h3>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Risk Factors</p>
              <ul className="space-y-1">
                {analysis!.riskAssessment?.factors?.map((f, i) => (
                  <li key={i} className="text-gray-700">- {f}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Black Swan Risks</p>
              <ul className="space-y-1">
                {analysis!.riskAssessment?.blackSwanRisks?.map((r, i) => (
                  <li key={i} className="text-gray-700">- {r}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Regulatory Risks</p>
            <p className="text-gray-700">{analysis!.riskAssessment?.regulatoryRisks || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Historical Overview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Historical Overview</p>
        <p className="text-sm text-gray-700">{analysis!.fundamentalAnalysis?.historicalOverview || 'N/A'}</p>
      </div>

      {/* Sources */}
      {analysis!.sources?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sources</p>
          <div className="flex flex-wrap gap-2">
            {analysis!.sources?.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed">
        {analysis!.disclaimer}
      </p>
    </div>
  );
}
