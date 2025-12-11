export interface ExchangeFee {
  name: string;
  makerFee: number;    // Fee for limit orders (lower)
  takerFee: number;    // Fee for market orders (higher)
  withdrawalFee: number;
}

export const EXCHANGES: Record<string, ExchangeFee> = {
  binance: {
    name: 'Binance',
    makerFee: 0.001,      // 0.1%
    takerFee: 0.001,      // 0.1%
    withdrawalFee: 0.0005, // 0.05%
  },
  coinbase: {
    name: 'Coinbase Pro',
    makerFee: 0.004,      // 0.4%
    takerFee: 0.006,      // 0.6%
    withdrawalFee: 0.01,   // 1%
  },
  kraken: {
    name: 'Kraken',
    makerFee: 0.0016,     // 0.16%
    takerFee: 0.0026,     // 0.26%
    withdrawalFee: 0.0015, // 0.15%
  },
};

export type OrderType = 'market' | 'limit';

export function calculateFee(
  amount: number,
  price: number,
  orderType: OrderType,
  exchange: string
): number {
  const exchangeFees = EXCHANGES[exchange];
  if (!exchangeFees) return 0;

  const total = amount * price;
  const feeRate = orderType === 'market' ? exchangeFees.takerFee : exchangeFees.makerFee;
  
  return total * feeRate;
}

export function calculateNetAmount(
  amount: number,
  price: number,
  orderType: OrderType,
  exchange: string,
  action: 'buy' | 'sell'
): { total: number; fee: number; netAmount: number } {
  const total = amount * price;
  const fee = calculateFee(amount, price, orderType, exchange);
  
  if (action === 'buy') {
    return {
      total: total + fee,
      fee,
      netAmount: amount,
    };
  } else {
    return {
      total: total - fee,
      fee,
      netAmount: amount,
    };
  }
}

export function simulateSlippage(price: number, orderType: OrderType): number {
  if (orderType === 'limit') return price;
  
  // Market orders have 0.1-0.3% slippage
  const slippagePercent = 0.001 + (Math.random() * 0.002);
  return price * (1 + slippagePercent);
}