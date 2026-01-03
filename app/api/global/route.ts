import { NextResponse } from 'next/server';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Cache for global data
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 300000; // 5 minutes

const getHeaders = () => {
  return API_KEY ? { 'x-cg-demo-api-key': API_KEY } : {};
};

export async function GET() {
  try {
    // Check cache first
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const response = await axios.get(`${BASE_URL}/global`, {
      headers: getHeaders(),
      timeout: 10000,
    });

    // Store in cache
    cache = {
      data: response.data,
      timestamp: Date.now(),
    };

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching global data:', error.message);

    // Return cached data on error
    if (cache) {
      return NextResponse.json(cache.data);
    }

    return NextResponse.json(
      { error: 'Failed to fetch global market data' },
      { status: 500 }
    );
  }
}
