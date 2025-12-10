'use client';

import { useEffect, useState } from 'react';
import { getCryptoNews } from '@/lib/newsapi';
import type { NewsArticle } from '@/lib/newsapi';

export default function NewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const newsData = await getCryptoNews('cryptocurrency');
      setNews(newsData.slice(0, 5));
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Crypto News</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Crypto News</h2>
      
      <div className="space-y-3">
        {news.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-50 p-2 rounded transition"
          >
            <div className="text-sm font-medium text-gray-900 line-clamp-2">
              {item.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {item.source.name} • {new Date(item.publishedAt).toLocaleDateString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}