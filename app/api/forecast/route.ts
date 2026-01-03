import { NextRequest, NextResponse } from 'next/server';
import { generateForecast } from '@/lib/forecast';
import { canUseForecast, recordForecastUsage, isPremiumUser } from '@/lib/aiUsage';

// Cache for forecast results (30 minutes TTL for forecasts)
const forecastCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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
    const { coinId, coinName, symbol, marketData, userId } = body;

    // Validate required fields
    if (!coinId || !coinName || !symbol || !marketData) {
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

    // Check if user can use forecast (persisted in Firestore)
    const usageCheck = await canUseForecast(userId);

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

    // Check cache first
    const cacheKey = `forecast-${coinId}-${new Date().toDateString()}`;
    const cached = forecastCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        forecast: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
      });
    }

    // Record usage for non-premium users (persisted to Firestore)
    if (!isPremium) {
      await recordForecastUsage(userId);
    }

    // Generate fresh forecast
    const forecast = await generateForecast(
      coinId,
      coinName,
      symbol,
      marketData,
      apiKey
    );

    // Cache the result
    forecastCache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    const now = Date.now();
    for (const [key, value] of forecastCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        forecastCache.delete(key);
      }
    }

    return NextResponse.json({
      forecast,
      cached: false,
    });
  } catch (error: any) {
    console.error('Forecast API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate forecast' },
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
