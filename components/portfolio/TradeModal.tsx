'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EXCHANGES, calculateNetAmount, type OrderType } from '@/lib/exchangeFees';
import { getUserSettings } from '@/lib/portfolio';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
  userBalance: number;
  userHoldings: number;
  userId: string;
  onTrade: (action: 'BUY' | 'SELL', quantity: number, orderType: OrderType, exchange: string) => Promise<void>;
}

export default function TradeModal({
  isOpen,
  onClose,
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
  userBalance,
  userHoldings,
  userId,
  onTrade,
}: TradeModalProps) {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [exchange, setExchange] = useState('binance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getUserSettings(userId);
      setExchange(settings.selectedExchange);
      setOrderType(settings.defaultOrderType);
    };
    
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  if (!isOpen) return null;

  const quantityNum = parseFloat(quantity) || 0;
  const { total, fee, netAmount } = calculateNetAmount(
    quantityNum,
    currentPrice,
    orderType,
    exchange,
    action.toLowerCase() as 'buy' | 'sell'
  );

  const maxBuy = userBalance / (currentPrice * (1 + EXCHANGES[exchange].takerFee));
  const maxSell = userHoldings;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (action === 'BUY' && total > userBalance) {
      setError(`Insufficient balance. Need $${total.toFixed(2)} (including fee)`);
      return;
    }

    if (action === 'SELL' && quantityNum > userHoldings) {
      setError('Insufficient holdings');
      return;
    }

    setIsProcessing(true);
    try {
      await onTrade(action, quantityNum, orderType, exchange);
      setQuantity('');
      onClose();
    } catch (err) {
      setError('Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Trade {coinSymbol.toUpperCase()}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Buy/Sell Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAction('BUY')}
              className={`flex-1 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                action === 'BUY'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setAction('SELL')}
              className={`flex-1 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                action === 'SELL'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sell
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Exchange Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange
              </label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              >
                {Object.entries(EXCHANGES).map(([key, ex]) => (
                  <option key={key} value={key}>
                    {ex.name} (Fee: {orderType === 'market' ? (ex.takerFee * 100).toFixed(2) : (ex.makerFee * 100).toFixed(2)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    orderType === 'market'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    orderType === 'limit'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Price
              </label>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                ${currentPrice.toLocaleString()}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              />
              <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                <span className="truncate">Max: {action === 'BUY' ? maxBuy.toFixed(8) : maxSell.toFixed(8)}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((action === 'BUY' ? maxBuy : maxSell).toFixed(8))}
                  className="text-indigo-600 hover:underline ml-2 flex-shrink-0"
                >
                  Use Max
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${(quantityNum * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee:</span>
                <span className="font-medium text-orange-600">${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-gray-900">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Balance Info */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className="font-medium">${userBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Holdings:</span>
                <span className="font-medium">{userHoldings.toFixed(8)}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing}
              className={`w-full text-sm sm:text-base ${
                action === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isProcessing ? 'Processing...' : `${action} ${coinSymbol.toUpperCase()}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
