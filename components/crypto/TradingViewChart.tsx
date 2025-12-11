'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string; // Coin symbol like "BTC", "ETH", "XRP"
}

// Map crypto symbols to TradingView format
const SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTCUSD',
  'ETH': 'ETHUSD',
  'XRP': 'XRPUSD',
  'ADA': 'ADAUSD',
  'SOL': 'SOLUSD',
  'DOGE': 'DOGEUSD',
  'DOT': 'DOTUSD',
  'MATIC': 'MATICUSD',
  'LTC': 'LTCUSD',
  'LINK': 'LINKUSD',
  'AVAX': 'AVAXUSD',
  'UNI': 'UNIUSD',
  'ATOM': 'ATOMUSD',
  'XLM': 'XLMUSD',
  'ALGO': 'ALGOUSD',
  'VET': 'VETUSD',
  'FIL': 'FILUSD',
  'HBAR': 'HBARUSD',
  'APT': 'APTUSD',
  'TRX': 'TRXUSD',
  'SHIB': 'SHIBUSD',
  'BCH': 'BCHUSD',
  'BNB': 'BNBUSD',
  'USDT': 'USDTUSD',
  'USDC': 'USDCUSD',
};

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Clean up any existing widget
    if (container.current) {
      container.current.innerHTML = '';
    }

    const loadWidget = () => {
      if (container.current && (window as any).TradingView) {
        const tradingViewSymbol = SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}USD`;
        
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${tradingViewSymbol}`,
          interval: 'D', // Daily by default
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_widget',
          studies: [
            'MASimple@tv-basicstudies', // Moving Average
          ],
        });
      }
    };

    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        loadWidget();
      };
      document.head.appendChild(script);
    } else {
      loadWidget();
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-[500px]">
      <div id="tradingview_widget" ref={container} className="w-full h-full" />
      <div className="text-xs text-gray-500 text-center mt-2">
        Powered by{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          TradingView
        </a>
      </div>
    </div>
  );
}
