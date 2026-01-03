import axios from 'axios';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const COINGECKO_BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL;
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Types for historical data and forecasts
export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface StatisticalAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  percentile25: number;
  percentile75: number;
  volatility: number;
  avgVolume: number;
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  priceDirection: 'uptrend' | 'downtrend' | 'sideways';
  momentum: number;
  rsi: number;
  movingAvg7d: number;
  movingAvg30d: number;
  bollingerUpper: number;
  bollingerLower: number;
}

export interface ForecastResult {
  coinId: string;
  coinName: string;
  symbol: string;
  currentPrice: number;
  generatedAt: string;
  timeframes: {
    shortTerm: TimeframeForecast; // 24h - 7d
    mediumTerm: TimeframeForecast; // 1-4 weeks
    longTerm: TimeframeForecast; // 1-3 months
  };
  technicalIndicators: {
    rsi: number;
    rsiSignal: 'overbought' | 'oversold' | 'neutral';
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    movingAverages: {
      ma7: number;
      ma30: number;
      ma90: number;
      signal: 'bullish' | 'bearish' | 'neutral';
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      position: 'above' | 'within' | 'below';
    };
    volumeAnalysis: string;
  };
  statisticalModel: {
    methodology: string;
    confidenceLevel: number;
    dataPoints: number;
    volatilityAdjustment: number;
  };
  marketFactors: {
    btcCorrelation: string;
    marketSentiment: string;
    keyEvents: string[];
    riskFactors: string[];
  };
  tradingStrategy: {
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    entryPoint: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    riskRewardRatio: number;
    positionSizing: string;
  };
  analystConsensus: {
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
    averageTarget: number;
    sources: string[];
  };
  disclaimer: string;
}

export interface TimeframeForecast {
  label: string;
  period: string;
  priceTargets: {
    low: number;
    average: number;
    high: number;
  };
  percentageChange: {
    low: number;
    average: number;
    high: number;
  };
  probability: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  confidence: number;
  reasoning: string;
}

// Get CoinGecko headers
const getCoinGeckoHeaders = () => {
  return COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};
};

// Fetch OHLC data from CoinGecko
export async function getOHLCData(coinId: string, days: number = 30): Promise<OHLCData[]> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/ohlc`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
      headers: getCoinGeckoHeaders(),
    });

    return response.data.map((item: number[]) => ({
      timestamp: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));
  } catch (error) {
    console.error('Error fetching OHLC data:', error);
    return [];
  }
}

// Fetch market chart data for volume and price history
export async function getMarketChartData(coinId: string, days: number = 90): Promise<MarketChartData | null> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
      headers: getCoinGeckoHeaders(),
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching market chart data:', error);
    return null;
  }
}

// Calculate statistical metrics from price data
export function calculateStatistics(prices: number[], volumes: number[]): StatisticalAnalysis {
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const n = prices.length;

  // Basic statistics
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0
    ? (sortedPrices[n / 2 - 1] + sortedPrices[n / 2]) / 2
    : sortedPrices[Math.floor(n / 2)];

  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const percentile25 = sortedPrices[Math.floor(n * 0.25)];
  const percentile75 = sortedPrices[Math.floor(n * 0.75)];

  // Volatility (annualized)
  const dailyReturns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const returnVariance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length;
  const volatility = Math.sqrt(returnVariance * 365) * 100;

  // Volume analysis
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const volumeTrend = recentVolume > avgVolume * 1.1 ? 'increasing' :
                      recentVolume < avgVolume * 0.9 ? 'decreasing' : 'stable';

  // Price direction
  const recentPrices = prices.slice(-14);
  const priceSlope = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
  const priceDirection = priceSlope > 0.02 ? 'uptrend' :
                         priceSlope < -0.02 ? 'downtrend' : 'sideways';

  // Momentum
  const momentum = ((prices[prices.length - 1] - prices[prices.length - 14]) / prices[prices.length - 14]) * 100;

  // RSI calculation
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < Math.min(15, prices.length); i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // Moving averages
  const movingAvg7d = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const movingAvg30d = prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, prices.length);

  // Bollinger Bands (20-day, 2 std dev)
  const bb20Prices = prices.slice(-20);
  const bb20Mean = bb20Prices.reduce((a, b) => a + b, 0) / bb20Prices.length;
  const bb20StdDev = Math.sqrt(bb20Prices.reduce((sum, p) => sum + Math.pow(p - bb20Mean, 2), 0) / bb20Prices.length);
  const bollingerUpper = bb20Mean + (2 * bb20StdDev);
  const bollingerLower = bb20Mean - (2 * bb20StdDev);

  return {
    mean,
    median,
    stdDev,
    variance,
    min: Math.min(...prices),
    max: Math.max(...prices),
    percentile25,
    percentile75,
    volatility,
    avgVolume,
    volumeTrend,
    priceDirection,
    momentum,
    rsi,
    movingAvg7d,
    movingAvg30d,
    bollingerUpper,
    bollingerLower,
  };
}

// Build forecast prompt for Perplexity
function buildForecastPrompt(
  coinName: string,
  symbol: string,
  currentPrice: number,
  stats: StatisticalAnalysis,
  ohlcData: OHLCData[],
  marketData: any
): string {
  const recentOHLC = ohlcData.slice(-14).map(d => ({
    date: new Date(d.timestamp).toISOString().split('T')[0],
    open: d.open.toFixed(4),
    high: d.high.toFixed(4),
    low: d.low.toFixed(4),
    close: d.close.toFixed(4),
  }));

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatLargeNumber = (num: number | undefined): string => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Calculate additional metrics
  const priceFromATH = marketData.ath?.usd ? ((currentPrice - marketData.ath.usd) / marketData.ath.usd * 100).toFixed(2) : 'N/A';
  const volumeToMcap = marketData.market_cap?.usd && marketData.total_volume?.usd
    ? ((marketData.total_volume.usd / marketData.market_cap.usd) * 100).toFixed(2)
    : 'N/A';

  return `Act as an expert quantitative technical analyst. Generate a precise price forecast for ${coinName} (${symbol.toUpperCase()}) using multi-timeframe technical analysis, statistical modeling, and current market research.

CURRENT MARKET DATA:
- Current Price: $${formatPrice(currentPrice)}
- 24h Change: ${marketData.price_change_percentage_24h?.toFixed(2) || 'N/A'}%
- 7d Change: ${marketData.price_change_percentage_7d?.toFixed(2) || 'N/A'}%
- 30d Change: ${marketData.price_change_percentage_30d?.toFixed(2) || 'N/A'}%
- Market Cap: ${formatLargeNumber(marketData.market_cap?.usd)}
- 24h Volume: ${formatLargeNumber(marketData.total_volume?.usd)}
- Volume/MCap: ${volumeToMcap}%
- ATH: $${marketData.ath?.usd?.toLocaleString() || 'N/A'} (${priceFromATH}% from ATH)
- ATL: $${marketData.atl?.usd?.toLocaleString() || 'N/A'}

STATISTICAL ANALYSIS (90-day historical):
- Mean: $${formatPrice(stats.mean)}
- Median: $${formatPrice(stats.median)}
- Std Dev: $${formatPrice(stats.stdDev)} (${((stats.stdDev / stats.mean) * 100).toFixed(2)}% of mean)
- Volatility (Annualized): ${stats.volatility.toFixed(1)}%
- 25th Percentile: $${formatPrice(stats.percentile25)}
- 75th Percentile: $${formatPrice(stats.percentile75)}
- 90-day Range: $${formatPrice(stats.min)} - $${formatPrice(stats.max)}

CALCULATED TECHNICAL INDICATORS:
- RSI (14): ${stats.rsi.toFixed(1)} [${stats.rsi > 70 ? 'OVERBOUGHT' : stats.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}]
- 7-day SMA: $${formatPrice(stats.movingAvg7d)}
- 30-day SMA: $${formatPrice(stats.movingAvg30d)}
- Price vs 7d MA: ${((currentPrice / stats.movingAvg7d - 1) * 100).toFixed(2)}%
- Price vs 30d MA: ${((currentPrice / stats.movingAvg30d - 1) * 100).toFixed(2)}%
- Bollinger Upper (2σ): $${formatPrice(stats.bollingerUpper)}
- Bollinger Lower (2σ): $${formatPrice(stats.bollingerLower)}
- Bollinger Width: ${((stats.bollingerUpper - stats.bollingerLower) / stats.mean * 100).toFixed(2)}%
- 14d Momentum: ${stats.momentum.toFixed(2)}%
- Volume Trend: ${stats.volumeTrend.toUpperCase()}
- Price Trend: ${stats.priceDirection.toUpperCase()}

RECENT OHLC DATA (14 days):
${JSON.stringify(recentOHLC, null, 2)}

ANALYSIS REQUIREMENTS:
1. Multi-timeframe technical analysis (1H, 4H, 1D, 1W charts)
2. Key support/resistance from price action and volume profile
3. Pattern recognition with probability assessment
4. Correlation analysis with BTC and market indices
5. Current analyst sentiment aggregation

Return forecast in this EXACT JSON format:

{
  "timeframes": {
    "shortTerm": {
      "label": "Short-Term",
      "period": "24h - 7 days",
      "priceTargets": {
        "low": ${(currentPrice * (1 - stats.stdDev / stats.mean * 2)).toFixed(4)},
        "average": ${currentPrice.toFixed(4)},
        "high": ${(currentPrice * (1 + stats.stdDev / stats.mean * 2)).toFixed(4)}
      },
      "percentageChange": {
        "low": -${((stats.stdDev / stats.mean) * 200).toFixed(2)},
        "average": 0,
        "high": ${((stats.stdDev / stats.mean) * 200).toFixed(2)}
      },
      "probability": {
        "bullish": 33,
        "bearish": 33,
        "neutral": 34
      },
      "confidence": 70,
      "reasoning": "Technical reasoning based on indicators and price action"
    },
    "mediumTerm": {
      "label": "Medium-Term",
      "period": "1-4 weeks",
      "priceTargets": { "low": 0, "average": 0, "high": 0 },
      "percentageChange": { "low": 0, "average": 0, "high": 0 },
      "probability": { "bullish": 33, "bearish": 33, "neutral": 34 },
      "confidence": 65,
      "reasoning": "Swing trade analysis"
    },
    "longTerm": {
      "label": "Long-Term",
      "period": "1-3 months",
      "priceTargets": { "low": 0, "average": 0, "high": 0 },
      "percentageChange": { "low": 0, "average": 0, "high": 0 },
      "probability": { "bullish": 33, "bearish": 33, "neutral": 34 },
      "confidence": 55,
      "reasoning": "Position trade thesis"
    }
  },
  "technicalIndicators": {
    "rsi": ${stats.rsi.toFixed(1)},
    "rsiSignal": "${stats.rsi > 70 ? 'overbought' : stats.rsi < 30 ? 'oversold' : 'neutral'}",
    "macdSignal": "bullish|bearish|neutral",
    "movingAverages": {
      "ma7": ${stats.movingAvg7d.toFixed(4)},
      "ma30": ${stats.movingAvg30d.toFixed(4)},
      "ma90": 0,
      "signal": "${currentPrice > stats.movingAvg30d ? 'bullish' : 'bearish'}"
    },
    "bollingerBands": {
      "upper": ${stats.bollingerUpper.toFixed(4)},
      "middle": ${((stats.bollingerUpper + stats.bollingerLower) / 2).toFixed(4)},
      "lower": ${stats.bollingerLower.toFixed(4)},
      "position": "${currentPrice > stats.bollingerUpper ? 'above' : currentPrice < stats.bollingerLower ? 'below' : 'within'}"
    },
    "volumeAnalysis": "Volume pattern analysis"
  },
  "statisticalModel": {
    "methodology": "Gaussian distribution with volatility-adjusted Monte Carlo simulation",
    "confidenceLevel": 68,
    "dataPoints": 90,
    "volatilityAdjustment": ${stats.volatility.toFixed(1)}
  },
  "marketFactors": {
    "btcCorrelation": "BTC correlation analysis with coefficient",
    "marketSentiment": "Current market sentiment from multiple sources",
    "keyEvents": ["Upcoming catalyst 1", "Upcoming catalyst 2"],
    "riskFactors": ["Risk factor 1", "Risk factor 2", "Risk factor 3"]
  },
  "tradingStrategy": {
    "recommendation": "strong_buy|buy|hold|sell|strong_sell",
    "entryPoint": ${(currentPrice * 0.98).toFixed(4)},
    "stopLoss": ${(currentPrice * 0.92).toFixed(4)},
    "takeProfit1": ${(currentPrice * 1.05).toFixed(4)},
    "takeProfit2": ${(currentPrice * 1.12).toFixed(4)},
    "takeProfit3": ${(currentPrice * 1.20).toFixed(4)},
    "riskRewardRatio": 2.5,
    "positionSizing": "Risk management recommendation based on volatility"
  },
  "analystConsensus": {
    "bullishPercent": 50,
    "bearishPercent": 25,
    "neutralPercent": 25,
    "averageTarget": ${currentPrice.toFixed(4)},
    "sources": ["Source 1", "Source 2"]
  }
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown or code blocks
- Replace all placeholder values with researched data
- Price targets must factor in ${stats.volatility.toFixed(1)}% annualized volatility
- Use 1σ for base case, 2σ for bull/bear scenarios
- Entry/exit levels based on support/resistance from OHLC data
- Risk/reward ratio minimum 2:1 for any trade recommendation
- Position sizing based on Kelly Criterion or fixed fractional
- Aggregate real analyst opinions where available`;
}

// Main forecast function
export async function generateForecast(
  coinId: string,
  coinName: string,
  symbol: string,
  marketData: any,
  apiKey: string
): Promise<ForecastResult> {
  // Fetch historical data
  const [ohlcData, chartData] = await Promise.all([
    getOHLCData(coinId, 90),
    getMarketChartData(coinId, 90),
  ]);

  if (!chartData || ohlcData.length === 0) {
    throw new Error('Failed to fetch historical data');
  }

  // Extract prices and volumes
  const prices = chartData.prices.map(p => p[1]);
  const volumes = chartData.total_volumes.map(v => v[1]);
  const currentPrice = marketData.current_price?.usd || prices[prices.length - 1];

  // Calculate statistics
  const stats = calculateStatistics(prices, volumes);

  // Build prompt and call Perplexity
  const prompt = buildForecastPrompt(coinName, symbol, currentPrice, stats, ohlcData, marketData);

  const response = await axios.post(
    PERPLEXITY_API_URL,
    {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a quantitative technical analyst specializing in cryptocurrency markets. Your forecasts are used by professional traders for position sizing and risk management.

Guidelines:
- Base all price targets on statistical analysis (standard deviations from mean)
- Provide specific entry/exit levels derived from support/resistance
- Calculate risk/reward ratios for all trade recommendations
- Use real-time market data and cite analyst sources
- Maintain conservative bias - underestimate gains, overestimate risks
- Always respond with valid JSON only, no markdown`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 5000,
      search_recency_filter: 'day',
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;

  // Parse JSON response
  let forecastData;
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    forecastData = JSON.parse(jsonString.trim());
  } catch (parseError) {
    console.error('Failed to parse forecast response:', parseError);
    throw new Error('Failed to parse AI forecast response');
  }

  return {
    coinId,
    coinName,
    symbol,
    currentPrice,
    generatedAt: new Date().toISOString(),
    ...forecastData,
    disclaimer: 'This forecast is generated by AI using statistical models and should not be considered financial advice. Cryptocurrency investments are highly volatile and speculative. Past performance does not guarantee future results. Always conduct your own research and consult a financial advisor before making investment decisions. Never invest more than you can afford to lose.',
  };
}

// Helper functions for UI
export function getRecommendationColor(recommendation: string): string {
  const colors: Record<string, string> = {
    strong_buy: 'bg-green-600',
    buy: 'bg-green-500',
    hold: 'bg-yellow-500',
    sell: 'bg-red-500',
    strong_sell: 'bg-red-600',
  };
  return colors[recommendation] || 'bg-gray-500';
}

export function formatRecommendation(recommendation: string): string {
  return recommendation.replace(/_/g, ' ').toUpperCase();
}

export function getRSIColor(rsi: number): string {
  if (rsi >= 70) return 'text-red-500';
  if (rsi <= 30) return 'text-green-500';
  return 'text-yellow-500';
}

export function getProbabilityBarColor(type: 'bullish' | 'bearish' | 'neutral'): string {
  const colors = {
    bullish: 'bg-green-500',
    bearish: 'bg-red-500',
    neutral: 'bg-yellow-500',
  };
  return colors[type];
}
