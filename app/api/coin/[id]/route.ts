import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Cache to prevent rate limiting
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

    if (!id) {
      return NextResponse.json({ error: 'Coin ID is required' }, { status: 400 });
    }

    // Check cache first
    const cached = cache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const response = await axios.get(`${BASE_URL}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
      },
      headers: getHeaders(),
      timeout: 10000,
    });

    // Store in cache
    cache.set(id, {
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
    console.error('Error fetching coin details:', error.message);

    // Check for cached data on error (rate limit fallback)
    const { id } = await params;
    const cached = cache.get(id);
    if (cached) {
      return NextResponse.json(cached.data);
    }

    // Return appropriate error
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch coin details' },
      { status: 500 }
    );
  }
}
