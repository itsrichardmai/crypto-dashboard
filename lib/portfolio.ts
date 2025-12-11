import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { calculateNetAmount } from './exchangeFees';

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCostBasis: number;
  totalCost: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  orderType: 'market' | 'limit';
  exchange: string;
  total: number;
  timestamp: Date;
}

export interface UserPortfolio {
  balance: number;
  holdings: Holding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface UserSettings {
  selectedExchange: string;
  defaultOrderType: 'market' | 'limit';
}

/**
 * Get user's paper trading balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userId), {
        paperTradingBalance: 10000,
        createdAt: new Date(),
      });
      return 10000;
    }
    
    return userDoc.data().paperTradingBalance || 10000;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 10000;
  }
}

/**
 * Get user's holdings
 */
export async function getUserHoldings(userId: string): Promise<Holding[]> {
  try {
    const holdingsRef = collection(db, 'portfolios', userId, 'holdings');
    const snapshot = await getDocs(holdingsRef);
    
    const holdings: Holding[] = [];
    snapshot.forEach((doc) => {
      holdings.push({
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
      } as Holding);
    });
    
    return holdings;
  } catch (error) {
    console.error('Error getting holdings:', error);
    return [];
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'portfolios', userId, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as Transaction);
    });
    
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

/**
 * Get user's exchange preference
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'trading'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as UserSettings;
    }
    
    return {
      selectedExchange: 'binance',
      defaultOrderType: 'market',
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return {
      selectedExchange: 'binance',
      defaultOrderType: 'market',
    };
  }
}

/**
 * Update user's exchange preference
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', userId, 'settings', 'trading'),
      settings,
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
  }
}

/**
 * Execute a buy order with fees
 */
export async function executeBuyWithFees(
  userId: string,
  symbol: string,
  name: string,
  quantity: number,
  price: number,
  orderType: 'market' | 'limit',
  exchange: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { total, fee } = calculateNetAmount(quantity, price, orderType, exchange, 'buy');
    
    const balance = await getUserBalance(userId);
    if (balance < total) {
      return { 
        success: false, 
        message: `Insufficient balance. Need $${total.toFixed(2)} (including $${fee.toFixed(2)} fee)` 
      };
    }
    
    await updateDoc(doc(db, 'users', userId), {
      paperTradingBalance: increment(-total),
    });
    
    const holdingRef = doc(db, 'portfolios', userId, 'holdings', symbol);
    const holdingDoc = await getDoc(holdingRef);
    
    if (holdingDoc.exists()) {
      const existing = holdingDoc.data() as Holding;
      const newQuantity = existing.quantity + quantity;
      const newTotalCost = existing.totalCost + total;
      const newAvgCostBasis = newTotalCost / newQuantity;
      
      await updateDoc(holdingRef, {
        quantity: newQuantity,
        avgCostBasis: newAvgCostBasis,
        totalCost: newTotalCost,
        lastUpdated: new Date(),
      });
    } else {
      await setDoc(holdingRef, {
        symbol,
        name,
        quantity,
        avgCostBasis: total / quantity,
        totalCost: total,
        lastUpdated: new Date(),
      });
    }
    
    await addDoc(collection(db, 'portfolios', userId, 'transactions'), {
      symbol,
      name,
      action: 'BUY',
      quantity,
      price,
      fee,
      orderType,
      exchange,
      total,
      timestamp: new Date(),
    });
    
    return { 
      success: true, 
      message: `Purchase successful! Fee: $${fee.toFixed(2)}` 
    };
  } catch (error) {
    console.error('Error executing buy:', error);
    return { success: false, message: 'Transaction failed' };
  }
}

/**
 * Execute a sell order with fees
 */
export async function executeSellWithFees(
  userId: string,
  symbol: string,
  name: string,
  quantity: number,
  price: number,
  orderType: 'market' | 'limit',
  exchange: string
): Promise<{ success: boolean; message: string }> {
  try {
    const holdingRef = doc(db, 'portfolios', userId, 'holdings', symbol);
    const holdingDoc = await getDoc(holdingRef);
    
    if (!holdingDoc.exists()) {
      return { success: false, message: 'No holdings to sell' };
    }
    
    const holding = holdingDoc.data() as Holding;
    if (holding.quantity < quantity) {
      return { success: false, message: 'Insufficient holdings' };
    }
    
    const { total, fee } = calculateNetAmount(quantity, price, orderType, exchange, 'sell');
    
    await updateDoc(doc(db, 'users', userId), {
      paperTradingBalance: increment(total),
    });
    
    const newQuantity = holding.quantity - quantity;
    
    if (newQuantity === 0) {
      await deleteDoc(holdingRef);
    } else {
      const newTotalCost = holding.totalCost - (quantity * holding.avgCostBasis);
      await updateDoc(holdingRef, {
        quantity: newQuantity,
        totalCost: newTotalCost,
        lastUpdated: new Date(),
      });
    }
    
    await addDoc(collection(db, 'portfolios', userId, 'transactions'), {
      symbol,
      name,
      action: 'SELL',
      quantity,
      price,
      fee,
      orderType,
      exchange,
      total,
      timestamp: new Date(),
    });
    
    return { 
      success: true, 
      message: `Sale successful! Fee: $${fee.toFixed(2)}. Net proceeds: $${total.toFixed(2)}` 
    };
  } catch (error) {
    console.error('Error executing sell:', error);
    return { success: false, message: 'Transaction failed' };
  }
}
