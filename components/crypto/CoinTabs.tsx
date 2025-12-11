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
    <div className="flex gap-2 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`px-6 py-3 font-medium transition ${
            activeTab === tab.id
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}