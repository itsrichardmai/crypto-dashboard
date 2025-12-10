export interface CryptoAsset {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: number;
    ath_date: string;
}

export interface UserHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgCostBasis: number;
  currentPrice: number;
  totalValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
}

export interface PaperTrade {
  id: string;
  userId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  status: 'executed' | 'pending' | 'cancelled';
}