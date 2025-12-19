'use client';

import { useState } from 'react';

interface AboutSectionProps {
  coin: {
    name: string;
    description: {
      en: string;
    };
  };
}

export default function AboutSection({ coin }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Clean and truncate description
  const cleanDescription = (html: string) => {
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const decoded = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return decoded;
  };

  const fullText = cleanDescription(coin.description.en);
  const shortText = fullText.slice(0, 400) + '...';
  const displayText = isExpanded ? fullText : shortText;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg p-6 border border-blue-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        About {coin.name}
      </h2>
      
      <div className="text-gray-700 leading-relaxed mb-4">
        {displayText}
      </div>

      {fullText.length > 400 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-2 transition"
        >
          {isExpanded ? (
            <>
              Show Less
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Read More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
