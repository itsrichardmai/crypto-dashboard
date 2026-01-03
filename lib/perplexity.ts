import axios from 'axios';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface CoinMarketData {
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d?: number;
  priceChange30d?: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  marketCapRank: number;
}

export interface AIAnalysisResult {
  executiveSummary: string;
  fundamentalAnalysis: {
    historicalOverview: string;
    tokenomics: {
      supply: string;
      distribution: string;
      inflationBurn: string;
    };
    networkMetrics: {
      tvl: string;
      activeAddresses: string;
      transactionVolume: string;
      developerActivity: string;
    };
    adoption: {
      corporateIntegrations: string[];
      institutionalHoldings: string;
      partnerships: string[];
    };
    strengths: string[];
    weaknesses: string[];
  };
  technicalAnalysis: {
    trend: 'bullish' | 'bearish' | 'neutral';
    trendStrength: 'strong' | 'moderate' | 'weak';
    supportLevels: { price: string; strength: string }[];
    resistanceLevels: { price: string; strength: string }[];
    indicators: {
      rsi: { value: number; signal: string };
      macd: { signal: string; histogram: string };
      ema: { ema50: string; ema200: string; crossover: string };
      bollingerBands: { position: string; bandwidth: string };
      volumeProfile: string;
    };
    patterns: { name: string; probability: string; target: string }[];
  };
  marketSentiment: {
    overall: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
    fearGreedIndex: number;
    socialVolume: string;
    institutionalFlow: string;
    retailActivity: string;
    newsImpact: string;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'very_high';
    volatilityScore: number;
    factors: string[];
    blackSwanRisks: string[];
    regulatoryRisks: string;
  };
  tradingInsights: {
    shortTerm: { outlook: string; strategy: string; keyLevels: string[] };
    mediumTerm: { outlook: string; strategy: string; keyLevels: string[] };
    longTerm: { outlook: string; strategy: string; keyLevels: string[] };
  };
  analystConsensus: {
    rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    priceTargets: {
      bearCase: { price: string; probability: number };
      baseCase: { price: string; probability: number };
      bullCase: { price: string; probability: number };
    };
    timeframe: string;
    sources: string[];
  };
  sources: { title: string; url: string }[];
  lastUpdated: string;
  disclaimer: string;
}

function buildAnalysisPrompt(coinData: CoinMarketData): string {
  const priceFormatted = coinData.currentPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: coinData.currentPrice < 1 ? 6 : 2,
  });

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (supply: number | null, symbol: string): string => {
    if (!supply) return 'Unlimited';
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
    return `${supply.toLocaleString()} ${symbol.toUpperCase()}`;
  };

  return `Act as a senior cryptocurrency fundamental analyst conducting deep research on ${coinData.name} (${coinData.symbol.toUpperCase()}).

CURRENT MARKET DATA:
- Current Price: ${priceFormatted}
- 24h Change: ${coinData.priceChange24h?.toFixed(2)}%
- 7d Change: ${coinData.priceChange7d?.toFixed(2) || 'N/A'}%
- 30d Change: ${coinData.priceChange30d?.toFixed(2) || 'N/A'}%
- Market Cap: ${formatLargeNumber(coinData.marketCap)} (Rank #${coinData.marketCapRank})
- 24h Volume: ${formatLargeNumber(coinData.volume24h)}
- Volume/MCap Ratio: ${((coinData.volume24h / coinData.marketCap) * 100).toFixed(2)}%
- Circulating Supply: ${formatSupply(coinData.circulatingSupply, coinData.symbol)}
- Total Supply: ${formatSupply(coinData.totalSupply, coinData.symbol)}
- Max Supply: ${formatSupply(coinData.maxSupply, coinData.symbol)}
- ATH: $${coinData.ath?.toLocaleString()} (${coinData.athDate ? new Date(coinData.athDate).toLocaleDateString() : 'N/A'})
- ATL: $${coinData.atl?.toLocaleString()} (${coinData.atlDate ? new Date(coinData.atlDate).toLocaleDateString() : 'N/A'})
- Distance from ATH: ${(((coinData.currentPrice - coinData.ath) / coinData.ath) * 100).toFixed(2)}%

RESEARCH REQUIREMENTS:
1. Historical Overview: Launch date, major upgrades/halvings, key historical events
2. Tokenomics: Supply mechanics, distribution, inflation/deflation mechanisms
3. On-Chain Metrics: TVL (if DeFi), active addresses, transaction volume, GitHub commits
4. Adoption Evidence: Corporate integrations (Tesla, PayPal, etc.), institutional holdings, major partnerships
5. Technical Analysis: Multi-timeframe analysis (1H/4H/1D/1W), key indicators, chart patterns
6. Analyst Consensus: Aggregate ratings from CoinBureau, Messari, Bloomberg, CryptoQuant
7. Risk Assessment: Regulatory threats, competition, black swan scenarios

Cite sources inline where applicable. Return analysis in this EXACT JSON format:

{
  "executiveSummary": "2-3 sentence professional summary of current state, key catalysts, and outlook",
  "fundamentalAnalysis": {
    "historicalOverview": "Launch date, major milestones, halvings/upgrades, pivotal events",
    "tokenomics": {
      "supply": "Current circulating vs max supply dynamics",
      "distribution": "Token allocation breakdown (team, investors, community, treasury)",
      "inflationBurn": "Annual inflation rate or burn mechanics with specifics"
    },
    "networkMetrics": {
      "tvl": "Total Value Locked if applicable, with trend",
      "activeAddresses": "Daily/monthly active addresses trend",
      "transactionVolume": "On-chain transaction volume analysis",
      "developerActivity": "GitHub commits, contributors, development velocity"
    },
    "adoption": {
      "corporateIntegrations": ["Company 1 - use case", "Company 2 - use case"],
      "institutionalHoldings": "Notable institutional positions (Grayscale, MicroStrategy, etc.)",
      "partnerships": ["Partnership 1 with details", "Partnership 2 with details"]
    },
    "strengths": ["Strength 1 with evidence", "Strength 2 with evidence", "Strength 3"],
    "weaknesses": ["Weakness 1 with evidence", "Weakness 2 with evidence", "Weakness 3"]
  },
  "technicalAnalysis": {
    "trend": "bullish|bearish|neutral",
    "trendStrength": "strong|moderate|weak",
    "supportLevels": [
      {"price": "$XX,XXX", "strength": "Major - tested X times"},
      {"price": "$XX,XXX", "strength": "Minor - recent pivot"}
    ],
    "resistanceLevels": [
      {"price": "$XX,XXX", "strength": "Major - historical rejection zone"},
      {"price": "$XX,XXX", "strength": "Minor - short-term resistance"}
    ],
    "indicators": {
      "rsi": {"value": 50, "signal": "Neutral - no divergence"},
      "macd": {"signal": "bullish|bearish|neutral", "histogram": "Expanding/contracting with momentum"},
      "ema": {"ema50": "$XX,XXX", "ema200": "$XX,XXX", "crossover": "Golden cross/Death cross/None"},
      "bollingerBands": {"position": "Upper/Middle/Lower band", "bandwidth": "Expanding/Contracting"},
      "volumeProfile": "Volume trend analysis and VWAP positioning"
    },
    "patterns": [
      {"name": "Pattern name", "probability": "XX%", "target": "$XX,XXX"}
    ]
  },
  "marketSentiment": {
    "overall": "very_bullish|bullish|neutral|bearish|very_bearish",
    "fearGreedIndex": 50,
    "socialVolume": "Social media activity trend with specifics",
    "institutionalFlow": "Recent institutional buying/selling activity",
    "retailActivity": "Retail sentiment from exchanges and social platforms",
    "newsImpact": "Recent news events affecting price action"
  },
  "riskAssessment": {
    "level": "low|medium|high|very_high",
    "volatilityScore": 7,
    "factors": ["Risk factor 1", "Risk factor 2", "Risk factor 3"],
    "blackSwanRisks": ["Potential black swan 1", "Potential black swan 2"],
    "regulatoryRisks": "Current regulatory landscape and pending legislation"
  },
  "tradingInsights": {
    "shortTerm": {
      "outlook": "1-7 day directional bias with reasoning",
      "strategy": "Specific entry/exit approach for day traders",
      "keyLevels": ["$XX,XXX - description", "$XX,XXX - description"]
    },
    "mediumTerm": {
      "outlook": "1-4 week directional bias with reasoning",
      "strategy": "Swing trading approach with position management",
      "keyLevels": ["$XX,XXX - description", "$XX,XXX - description"]
    },
    "longTerm": {
      "outlook": "1-6 month investment thesis",
      "strategy": "Accumulation/distribution strategy for investors",
      "keyLevels": ["$XX,XXX - description", "$XX,XXX - description"]
    }
  },
  "analystConsensus": {
    "rating": "strong_buy|buy|hold|sell|strong_sell",
    "priceTargets": {
      "bearCase": {"price": "$XX,XXX", "probability": 25},
      "baseCase": {"price": "$XX,XXX", "probability": 50},
      "bullCase": {"price": "$XX,XXX", "probability": 25}
    },
    "timeframe": "6-12 months",
    "sources": ["Source 1", "Source 2", "Source 3"]
  },
  "sources": [
    {"title": "Source title 1", "url": "https://example.com"},
    {"title": "Source title 2", "url": "https://example.com"}
  ]
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown or code blocks
- Use real-time data from CoinMarketCap, CoinGecko, Dune Analytics, DefiLlama, Messari
- All price targets must be specific dollar amounts based on technical and fundamental analysis
- Quantify probabilities where possible (e.g., "70% chance of...")
- Focus on evidence-based analysis, not speculation or hype
- Include verifiable data points and cite sources
- Provide actionable insights suitable for professional traders and investors`;
}

export async function getPerplexityAnalysis(
  coinData: CoinMarketData,
  apiKey: string
): Promise<AIAnalysisResult> {
  const prompt = buildAnalysisPrompt(coinData);

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are a senior cryptocurrency analyst with expertise in fundamental analysis, technical analysis, and quantitative research. Your analysis is used by professional traders and institutional investors.

Guidelines:
- Provide evidence-based analysis with specific data points
- Use real-time market data and cite sources when possible
- All price targets must be specific dollar amounts with probability weights
- Focus on actionable insights, not speculation
- Maintain professional, objective tone without hype or promotional language
- Always respond with valid JSON only, no markdown formatting`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 6000,
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

    // Parse the JSON response
    let analysisData;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysisData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }

    return {
      ...analysisData,
      lastUpdated: new Date().toISOString(),
      disclaimer: 'This analysis is generated by AI using real-time market data and should not be considered financial advice. Cryptocurrency investments are highly volatile and speculative. Past performance does not guarantee future results. Always conduct independent research and consult a qualified financial advisor before making investment decisions.',
    };
  } catch (error: any) {
    console.error('Perplexity API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get AI analysis');
  }
}

export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    very_bullish: 'text-green-500',
    bullish: 'text-green-400',
    neutral: 'text-yellow-500',
    bearish: 'text-red-400',
    very_bearish: 'text-red-500',
  };
  return colors[sentiment] || 'text-gray-500';
}

export function getRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    strong_buy: 'bg-green-500',
    buy: 'bg-green-400',
    hold: 'bg-yellow-500',
    sell: 'bg-red-400',
    strong_sell: 'bg-red-500',
  };
  return colors[rating] || 'bg-gray-500';
}

export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    very_high: 'text-red-500',
  };
  return colors[level] || 'text-gray-500';
}

export function formatRating(rating: string): string {
  return rating.replace(/_/g, ' ').toUpperCase();
}

export function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
    bullish: 'BULLISH',
    bearish: 'BEARISH',
    neutral: 'NEUTRAL',
  };
  return labels[trend] || 'N/A';
}
