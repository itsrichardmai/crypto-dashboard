'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface NewsArticle {
  article_id: string;
  title: string;
  description: string;
  link: string;
  image_url?: string;
  pubDate: string;
  source_id: string;
}

interface NewsSectionProps {
  coinSymbol: string;
  coinName: string;
}

export default function NewsSection({ coinSymbol, coinName }: NewsSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        // Try coin name first
        const response = await axios.get('/api/newsdata', {
          params: {
            query: coinName,
          },
        });
        
        const newsResults = response.data.results || [];
        
        // Filter to only articles that mention the coin
        const relevantArticles = newsResults.filter((article: NewsArticle) => {
          const text = `${article.title} ${article.description}`.toLowerCase();
          return text.includes(coinName.toLowerCase()) || 
                 text.includes(coinSymbol.toLowerCase());
        });

        // If no relevant articles, show general crypto news
        if (relevantArticles.length === 0) {
          const generalResponse = await axios.get('/api/newsdata', {
            params: {
              query: 'cryptocurrency bitcoin ethereum',
            },
          });
          setArticles((generalResponse.data.results || []).slice(0, 5));
        } else {
          setArticles(relevantArticles.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [coinSymbol, coinName]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 rounded-lg shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
        Latest News
      </h2>

      {isLoading ? (
        <div className="text-center py-8 text-white">Loading news...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-white">
          No news available at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <a
              key={article.article_id}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/10 backdrop-blur-sm hover:bg-white/20 transition rounded-lg p-4 border border-white/20"
            >
              <div className="flex gap-4">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-purple-200 text-sm mb-2 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span>{article.source_id}</span>
                    <span>•</span>
                    <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-xs text-purple-300">
        <p>
          News powered by{' '}
          <a
            href="https://newsdata.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:underline"
          >
            Newsdata.io
          </a>
        </p>
      </div>
    </div>
  );
}
