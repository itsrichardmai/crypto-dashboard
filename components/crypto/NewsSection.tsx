'use client';

import { useEffect, useState } from 'react';
import { getCryptoNews } from '@/lib/newsapi';
import type { NewsArticle } from '@/lib/newsapi';

export default function NewsSection({ coinSymbol }: { coinSymbol: string }) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      const data = await getCryptoNews(`${coinSymbol} cryptocurrency`);
      setNews(data);
      setIsLoading(false);
    };
    fetchNews();
  }, [coinSymbol]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600">
        <div className="animate-pulse">Loading latest news...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest News</h2>
      <div className="space-y-4">
        {news.map((article, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-indigo-300 transition-all"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-gray-900 hover:text-indigo-600 block mb-2"
            >
              {article.title}
            </a>
            
            <p className="text-gray-600 mb-3 text-sm">
              {article.description}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="font-medium text-indigo-600">
                {article.source.name}
              </span>
              <span>•</span>
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>News powered by NewsAPI</p>
      </div>
    </div>
  );
}
