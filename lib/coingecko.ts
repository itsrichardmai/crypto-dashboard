import axios from 'axios';
import type { CryptoAsset } from '@/types/crypto';

const BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Cache to prevent rate limiting
const cache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

// Helper function to get headers with API key
const getHeaders = () => {
  return API_KEY ? {
    'x-cg-demo-api-key': API_KEY
  } : {};
};

export async function getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
  try {
    const response = await axios.get(`${BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
      },
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top cryptos:', error);
    return [];
  }
}

export async function getCryptoPrice(id: string): Promise<number | null> {
  try {
    const response = await axios.get(`/api/price?id=${id}`);
    return response.data[id]?.usd || null;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
}

export async function getCryptoDetails(id: string) {
  // Check cache first
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Use API route to avoid CORS issues
    const response = await axios.get(`/api/coin/${id}`);

    // Store in cache
    cache.set(id, {
      data: response.data,
      timestamp: Date.now()
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    // Return cached data even if expired when rate limited
    if (cached) {
      return cached.data;
    }
    return null;
  }
}

export async function getTrendingCoins() {
  try {
    const response = await axios.get(`${BASE_URL}/search/trending`, {
      headers: getHeaders(),
    });
    return response.data.coins;
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
}
