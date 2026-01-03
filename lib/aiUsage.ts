import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';

export interface AIUsageRecord {
  analysisUsed: boolean;
  forecastUsed: boolean;
  analysisCount: number;
  forecastCount: number;
  lastAnalysisAt: Date | null;
  lastForecastAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAIUsage {
  analysisUsed: boolean;
  forecastUsed: boolean;
  analysisCount: number;
  forecastCount: number;
}

// Premium user IDs - add your test account Firebase UID here
const PREMIUM_USER_IDS = new Set([
  // Add your Firebase UID here for unlimited access
  process.env.NEXT_PUBLIC_PREMIUM_USER_ID || '',
]);

export function isPremiumUser(userId: string): boolean {
  return PREMIUM_USER_IDS.has(userId);
}

// Get user's AI usage from Firestore
export async function getUserAIUsage(userId: string): Promise<UserAIUsage> {
  if (!userId) {
    return { analysisUsed: false, forecastUsed: false, analysisCount: 0, forecastCount: 0 };
  }

  try {
    const usageRef = doc(db, 'aiUsage', userId);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      const data = usageSnap.data();
      return {
        analysisUsed: data.analysisUsed || false,
        forecastUsed: data.forecastUsed || false,
        analysisCount: data.analysisCount || 0,
        forecastCount: data.forecastCount || 0,
      };
    }

    // Create initial record if it doesn't exist
    await setDoc(usageRef, {
      analysisUsed: false,
      forecastUsed: false,
      analysisCount: 0,
      forecastCount: 0,
      lastAnalysisAt: null,
      lastForecastAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { analysisUsed: false, forecastUsed: false, analysisCount: 0, forecastCount: 0 };
  } catch (error) {
    console.error('Error getting AI usage:', error);
    // Return default values on error
    return { analysisUsed: false, forecastUsed: false, analysisCount: 0, forecastCount: 0 };
  }
}

// Record that user has used AI analysis
export async function recordAnalysisUsage(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const usageRef = doc(db, 'aiUsage', userId);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      await updateDoc(usageRef, {
        analysisUsed: true,
        analysisCount: increment(1),
        lastAnalysisAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(usageRef, {
        analysisUsed: true,
        forecastUsed: false,
        analysisCount: 1,
        forecastCount: 0,
        lastAnalysisAt: serverTimestamp(),
        lastForecastAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error recording analysis usage:', error);
  }
}

// Record that user has used AI forecast
export async function recordForecastUsage(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const usageRef = doc(db, 'aiUsage', userId);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      await updateDoc(usageRef, {
        forecastUsed: true,
        forecastCount: increment(1),
        lastForecastAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(usageRef, {
        analysisUsed: false,
        forecastUsed: true,
        analysisCount: 0,
        forecastCount: 1,
        lastAnalysisAt: null,
        lastForecastAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error recording forecast usage:', error);
  }
}

// Check if user can use analysis (for free tier)
export async function canUseAnalysis(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Premium users always have access
  if (isPremiumUser(userId)) {
    return { allowed: true };
  }

  try {
    const usage = await getUserAIUsage(userId);

    if (usage.analysisUsed) {
      return {
        allowed: false,
        reason: 'Free trial used. Upgrade to premium for unlimited AI analysis.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking analysis permission:', error);
    // Allow on error to not block users
    return { allowed: true };
  }
}

// Check if user can use forecast (for free tier)
export async function canUseForecast(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Premium users always have access
  if (isPremiumUser(userId)) {
    return { allowed: true };
  }

  try {
    const usage = await getUserAIUsage(userId);

    if (usage.forecastUsed) {
      return {
        allowed: false,
        reason: 'Free trial used. Upgrade to premium for unlimited forecasts.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking forecast permission:', error);
    // Allow on error to not block users
    return { allowed: true };
  }
}

// Reset user's AI usage (admin function)
export async function resetUserAIUsage(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const usageRef = doc(db, 'aiUsage', userId);
    await setDoc(usageRef, {
      analysisUsed: false,
      forecastUsed: false,
      analysisCount: 0,
      forecastCount: 0,
      lastAnalysisAt: null,
      lastForecastAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting AI usage:', error);
  }
}
