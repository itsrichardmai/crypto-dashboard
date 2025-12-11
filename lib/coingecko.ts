import axios from 'axios';
import type { CryptoAsset } from '@/types/crypto';

const BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL;

// Cache to prevent rate limiting
const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute

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
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top cryptos:', error);
    return [];
  }
}

export async function getCryptoPrice(id: string): Promise<number | null> {
  try {
    const response = await axios.get(`${BASE_URL}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
      },
    });
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
    const response = await axios.get(`${BASE_URL}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
      },
    });
    
    // Store in cache
    cache.set(id, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    return null;
  }
}

export async function getTrendingCoins() {
  try {
    const response = await axios.get(`${BASE_URL}/search/trending`);
    return response.data.coins;
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
}