import { NextRequest, NextResponse } from 'next/server';
import { getPerplexityAnalysis, CoinMarketData } from '@/lib/perplexity';
import { canUseAnalysis, recordAnalysisUsage, isPremiumUser } from '@/lib/aiUsage';

// Cache for analysis results (1 hour TTL)
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

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

    // Check if user can use analysis (persisted in Firestore)
    const usageCheck = await canUseAnalysis(userId);

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          trialExpired: true,
          isPremiumRequired: true
        },
        { status: 403 }
      );
    }

    const isPremium = isPremiumUser(userId);

    // Check cache first (cached results don't count against trial)
    const cacheKey = `${coinData.symbol.toLowerCase()}-${new Date().toDateString()}`;
    const cached = analysisCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        analysis: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
        trialUsed: !isPremium,
      });
    }

    // Record usage for non-premium users (persisted to Firestore)
    if (!isPremium) {
      await recordAnalysisUsage(userId);
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
