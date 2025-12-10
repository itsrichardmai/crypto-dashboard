import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_CRYPTOPANIC_API_KEY;
const BASE_URL = 'https://cryptopanic.com/api/v1';

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  source?: {  // ← Add question mark
    title: string;
    domain: string;
  };
  published_at: string;
  kind: 'news' | 'media';
  votes?: {
    positive: number;
    negative: number;
    important: number;
  };
  currencies?: Array<{
    code: string;
    title: string;
  }>;
}
export interface NewsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NewsItem[];
}

/**
 * Fetch news posts from CryptoPanic
 * @param filter - 'rising' | 'hot' | 'trending' | 'latest' | 'bullish' | 'bearish'
 * @param currencies - Array of currency codes (e.g., ['BTC', 'ETH'])
 * @param regions - Filter by region (e.g., 'en' for English)
 */
export async function getNews(
  filter: string = 'hot',
  currencies?: string[],
  regions: string = 'en'
): Promise<NewsItem[]> {
  try {
    const params: any = {
      filter: filter,
    };

    if (currencies && currencies.length > 0) {
      params.currencies = currencies.join(',');
    }

    // Call our API proxy instead of CryptoPanic directly
    const response = await axios.get<NewsResponse>('/api/news', {
      params,
    });

    return response.data.results;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}
/**
 * Get sentiment for a news item
 */
export function getSentiment(item: NewsItem): 'bullish' | 'bearish' | 'neutral' {
  // Check if votes exist
  if (!item.votes) {
    return 'neutral';
  }
  
  const { positive, negative } = item.votes;
  
  if (positive > negative * 1.5) return 'bullish';
  if (negative > positive * 1.5) return 'bearish';
  return 'neutral';
}

/**
 * Get sentiment color
 */
export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'bullish':
      return 'bg-green-100 text-green-700';
    case 'bearish':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get sentiment emoji
 */
export function getSentimentEmoji(sentiment: string): string {
  switch (sentiment) {
    case 'bullish':
      return '🟢';
    case 'bearish':
      return '🔴';
    default:
      return '⚪';
  }
}