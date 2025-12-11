'use client';

interface CoinTabsProps {
  activeTab: 'overview' | 'news' | 'ai-analysis' | 'forecast';
  setActiveTab: (tab: 'overview' | 'news' | 'ai-analysis' | 'forecast') => void;
}

export default function CoinTabs({ activeTab, setActiveTab }: CoinTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'news', label: 'News' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'forecast', label: 'Forecast' },
  ];

  return (
    <div className="flex gap-2 border-b-2 border-gray-200 bg-white rounded-t-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === tab.id
              ? 'border-b-4 border-indigo-600 text-indigo-600 bg-indigo-50'
              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
