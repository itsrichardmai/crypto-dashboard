'use client';

interface CoinTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CoinTabs({ activeTab, onTabChange }: CoinTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'news', label: 'News' },
    { id: 'analysis', label: 'AI Analysis' },
    { id: 'forecast', label: 'Forecast' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl mb-6">
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}