import { NextRequest, NextResponse } from 'next/server';
import { getPerplexityAnalysis, CoinMarketData } from '@/lib/perplexity';

// Cache for analysis results (1 hour TTL)
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Track free trial usage per user (in production, store in Firestore)
const freeTrialUsage = new Map<string, { analysisUsed: boolean; forecastUsed: boolean }>();

// Premium user IDs - add your test account Firebase UID here
const PREMIUM_USER_IDS = new Set([
  // Add your Firebase UID here for unlimited access
  'your-firebase-uid-here',
]);

// Export for sharing with forecast route
export { freeTrialUsage, PREMIUM_USER_IDS };

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { coinData, userId } = body as { coinData: CoinMarketData; userId?: string };

    if (!coinData || !coinData.symbol) {
      return NextResponse.json(
        { error: 'Missing required coin data' },
        { status: 400 }
      );
    }

    // Must be authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Premium feature - authentication required', isPremiumRequired: true },
        { status: 403 }
      );
    }

    // Check if premium user (unlimited access)
    const isPremium = PREMIUM_USER_IDS.has(userId);

    // Check free trial status
    const userTrialStatus = freeTrialUsage.get(userId) || { analysisUsed: false, forecastUsed: false };

    if (!isPremium && userTrialStatus.analysisUsed) {
      return NextResponse.json(
        {
          error: 'Free trial used. Upgrade to premium for unlimited AI analysis.',
          trialExpired: true,
          isPremiumRequired: true
        },
        { status: 403 }
      );
    }

    // Check cache first (cached results don't count against trial)
    const cacheKey = `${coinData.symbol.toLowerCase()}-${new Date().toDateString()}`;
    const cached = analysisCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        analysis: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
        trialUsed: !isPremium && userTrialStatus.analysisUsed,
      });
    }

    // Mark free trial as used (only for non-premium users, only for fresh requests)
    if (!isPremium) {
      freeTrialUsage.set(userId, { ...userTrialStatus, analysisUsed: true });
    }

    // Get fresh analysis from Perplexity
    const analysis = await getPerplexityAnalysis(coinData, apiKey);

    // Cache the result
    analysisCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    const now = Date.now();
    for (const [key, value] of analysisCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        analysisCache.delete(key);
      }
    }

    return NextResponse.json({
      analysis,
      cached: false,
      trialUsed: !isPremium,
    });
  } catch (error: any) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with coin data.' },
    { status: 405 }
  );
}
