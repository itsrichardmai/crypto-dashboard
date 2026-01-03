import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Cache for market chart data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

const getHeaders = () => {
  return API_KEY ? { 'x-cg-demo-api-key': API_KEY } : {};
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';

    if (!id) {
      return NextResponse.json({ error: 'Coin ID is required' }, { status: 400 });
    }

    const cacheKey = `${id}-${days}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const response = await axios.get(`${BASE_URL}/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
      headers: getHeaders(),
      timeout: 10000,
    });

    // Store in cache
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION * 2) {
        cache.delete(key);
      }
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching market chart:', error.message);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    const cacheKey = `${id}-${days}`;

    // Return cached data on error
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached.data);
    }

    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch market chart' },
      { status: 500 }
    );
  }
}
