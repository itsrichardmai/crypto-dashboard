'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published_at: string;
}

export default function NewsSection({ coinSymbol }: { coinSymbol: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, show placeholder news
    // In production, integrate with CryptoPanic API or NewsAPI
    const placeholderNews = [
      {
        title: `${coinSymbol.toUpperCase()} Price Analysis: Technical Indicators Point to Bullish Momentum`,
        url: '#',
        source: 'CoinDesk',
        published_at: new Date().toISOString(),
      },
      {
        title: `Major Exchange Lists ${coinSymbol.toUpperCase()}, Trading Volume Surges`,
        url: '#',
        source: 'CoinTelegraph',
        published_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        title: `Institutional Interest in ${coinSymbol.toUpperCase()} Reaches All-Time High`,
        url: '#',
        source: 'Decrypt',
        published_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    setTimeout(() => {
      setNews(placeholderNews);
      setIsLoading(false);
    }, 500);
  }, [coinSymbol]);

  if (isLoading) {
    return <div className="text-center py-8">Loading news...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest News</h2>
      
      <div className="space-y-4">
        {news.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                >
                  {item.title}
                </a>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <span className="font-medium">{item.source}</span>
                  <span>•</span>
                  <span>{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                🟢 Bullish
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>📰 Real news integration coming in production (CryptoPanic API)</p>
      </div>
    </div>
  );
}