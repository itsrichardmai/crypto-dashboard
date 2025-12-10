import axios from 'axios';

const API_KEY = process.env.NEWSAPI_KEY;

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export async function getCryptoNews(query: string = 'cryptocurrency'): Promise<NewsArticle[]> {
  try {
    const response = await axios.get('/api/news', {
      params: { q: query }
    });

    return response.data.articles;
  } catch (error) {
    console.error('NewsAPI Error:', error);
    return [];
  }
}