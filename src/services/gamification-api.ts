import axios from "axios";
import { getFirmezaAccessToken } from "./auth/auth-storage";

// Base URL for the gamification API
const GAMIFICATION_API = process.env.NEXT_PUBLIC_GAMIFICATION_API;

if (!GAMIFICATION_API) {
  throw new Error("NEXT_PUBLIC_GAMIFICATION_API environment variable is required.");
}

const gamificationApiClient = axios.create({
  baseURL: GAMIFICATION_API,
  timeout: Number(process.env.NEXT_PUBLIC_FMZ_API_TIMEOUT_MS || 30000),
});

gamificationApiClient.interceptors.request.use((config) => {
  const accessToken = getFirmezaAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Smart Contract addresses for FMZ tokens
const FMZ_TOKEN_CONTRACT = process.env.NEXT_PUBLIC_FMZ_TOKEN_CONTRACT;
const GAMIFICATION_CONTRACT = process.env.NEXT_PUBLIC_GAMIFICATION_CONTRACT;

export interface GameUser {
  address: string;
  totalPoints: number;
  level: number;
  levelName: string;
  fmzTokenBalance: number;
  claimableTokens: number;
  achievements: GameAchievement[];
  dailyStreak: number;
  lastActivity: Date;
  profile: 'renter' | 'investor';
  monthlyChallenge: MonthlyChallenge | null;
}

export interface GameAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: Date;
  category: 'payment' | 'investment' | 'engagement' | 'milestone';
  nftContractAddress?: string;
  tokenId?: number;
}

export interface MonthlyChallenge {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  completed: boolean;
  expiresAt: Date;
}

export interface PointTransaction {
  id: string;
  userAddress: string;
  action: 'earn' | 'spend' | 'bonus';
  points: number;
  description: string;
  metadata?: Record<string, any>;
  txHash?: string;
  blockNumber?: number;
  timestamp: Date;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  totalPoints: number;
  level: number;
  levelName: string;
  achievementCount: number;
  monthlyPoints: number;
  avatar: string;
  profile: 'renter' | 'investor';
}

// Points calculation rules
export const POINT_RULES = {
  // Renter actions
  RENT_PAYMENT_ON_TIME: 100,
  RENT_PAYMENT_EARLY: 150,
  TOKEN_PURCHASE: 10, // per token
  FIRST_TOKEN_PURCHASE: 200,
  PROPERTY_OWNERSHIP_5_PERCENT: 500,
  PROPERTY_OWNERSHIP_10_PERCENT: 1000,
  PROPERTY_OWNERSHIP_25_PERCENT: 2500,
  PROPERTY_OWNERSHIP_50_PERCENT: 5000,

  // Investor actions
  INVESTMENT_MADE: 50, // per R$ 100 invested
  YIELD_RECEIVED: 20, // per R$ 10 yield
  PORTFOLIO_DIVERSIFICATION: 300, // investing in multiple properties
  LONG_TERM_HOLD: 1000, // holding for 1+ years

  // Engagement actions
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 50,
  MONTHLY_STREAK: 200,
  REFERRAL_SIGNUP: 500,
  SOCIAL_SHARE: 25,

  // Milestone achievements
  FIRST_INVESTMENT: 250,
  FIRST_PROPERTY_FRACTION: 500,
  MILLIONAIRE_INVESTMENT: 10000,
};

// Level system
export const LEVELS = [
  { level: 1, name: 'Bronze', minPoints: 0, color: '#CD7F32', tokenMultiplier: 1, benefits: ['Acesso básico à plataforma'] },
  { level: 2, name: 'Prata', minPoints: 1000, color: '#C0C0C0', tokenMultiplier: 1.2, benefits: ['20% mais tokens de bônus', 'Acesso a relatórios avançados'] },
  { level: 3, name: 'Ouro', minPoints: 5000, color: '#FFD700', tokenMultiplier: 1.5, benefits: ['50% mais tokens de bônus', 'Suporte prioritário', 'Acesso a investimentos exclusivos'] },
  { level: 4, name: 'Platina', minPoints: 15000, color: '#E5E4E2', tokenMultiplier: 2, benefits: ['100% mais tokens de bônus', 'Taxa reduzida', 'Consultor pessoal'] },
  { level: 5, name: 'Diamante', minPoints: 50000, color: '#B9F2FF', tokenMultiplier: 3, benefits: ['200% mais tokens de bônus', 'Acesso VIP', 'Eventos exclusivos', 'Zero taxas'] }
];

/**
 * Get user's gamification data
 */
export async function getUserGameData(userAddress: string): Promise<GameUser | null> {
  try {
    const response = await gamificationApiClient.post(`/getUserData`, {
      address: userAddress
    });

    if (response.status === 200) {
      return {
        address: response.data.address,
        totalPoints: response.data.totalPoints,
        level: response.data.level,
        levelName: response.data.levelName,
        fmzTokenBalance: response.data.fmzTokenBalance,
        claimableTokens: response.data.claimableTokens,
        achievements: response.data.achievements,
        dailyStreak: response.data.dailyStreak,
        lastActivity: new Date(response.data.lastActivity),
        profile: response.data.profile,
        monthlyChallenge: response.data.monthlyChallenge
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user game data:", error);
    return null;
  }
}

/**
 * Award points to user
 */
export async function awardPoints(
  userAddress: string,
  action: string,
  points: number,
  metadata?: Record<string, any>
): Promise<PointTransaction | null> {
  try {
    const response = await gamificationApiClient.post(`/awardPoints`, {
      userAddress,
      action,
      points,
      metadata
    });

    if (response.status === 200) {
      return {
        id: response.data.id,
        userAddress: response.data.userAddress,
        action: 'earn',
        points: response.data.points,
        description: response.data.description,
        metadata: response.data.metadata,
        txHash: response.data.txHash,
        blockNumber: response.data.blockNumber,
        timestamp: new Date(response.data.timestamp)
      };
    }
    return null;
  } catch (error) {
    console.error("Error awarding points:", error);
    return null;
  }
}

/**
 * Claim FMZ bonus tokens
 */
export async function claimBonusTokens(userAddress: string): Promise<{ success: boolean; txHash?: string; tokensAwarded?: number }> {
  try {
    const response = await gamificationApiClient.post(`/claimTokens`, {
      userAddress
    });

    if (response.status === 200) {
      return {
        success: true,
        txHash: response.data.txHash,
        tokensAwarded: response.data.tokensAwarded
      };
    }
    return { success: false };
  } catch (error) {
    console.error("Error claiming bonus tokens:", error);
    return { success: false };
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  filter: 'all' | 'renter' | 'investor' = 'all',
  timeframe: 'week' | 'month' | 'all' = 'month',
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    const response = await gamificationApiClient.post(`/getLeaderboard`, {
      filter,
      timeframe,
      limit
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data.map((entry, index) => ({
        rank: index + 1,
        address: entry.address,
        displayName: entry.displayName,
        totalPoints: entry.totalPoints,
        level: entry.level,
        levelName: entry.levelName,
        achievementCount: entry.achievementCount,
        monthlyPoints: entry.monthlyPoints,
        avatar: entry.avatar,
        profile: entry.profile
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Unlock achievement
 */
export async function unlockAchievement(
  userAddress: string,
  achievementId: string
): Promise<{ success: boolean; nftMinted?: boolean; tokenId?: number }> {
  try {
    const response = await gamificationApiClient.post(`/unlockAchievement`, {
      userAddress,
      achievementId
    });

    if (response.status === 200) {
      return {
        success: true,
        nftMinted: response.data.nftMinted,
        tokenId: response.data.tokenId
      };
    }
    return { success: false };
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false };
  }
}

/**
 * Get user's point transaction history
 */
export async function getPointHistory(
  userAddress: string,
  limit: number = 50
): Promise<PointTransaction[]> {
  try {
    const response = await gamificationApiClient.post(`/getPointHistory`, {
      userAddress,
      limit
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data.map(tx => ({
        id: tx.id,
        userAddress: tx.userAddress,
        action: tx.action,
        points: tx.points,
        description: tx.description,
        metadata: tx.metadata,
        txHash: tx.txHash,
        blockNumber: tx.blockNumber,
        timestamp: new Date(tx.timestamp)
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching point history:", error);
    return [];
  }
}

/**
 * Update daily streak
 */
export async function updateDailyStreak(userAddress: string): Promise<{ streak: number; bonusPoints: number }> {
  try {
    const response = await gamificationApiClient.post(`/updateStreak`, {
      userAddress
    });

    if (response.status === 200) {
      return {
        streak: response.data.streak,
        bonusPoints: response.data.bonusPoints
      };
    }
    return { streak: 0, bonusPoints: 0 };
  } catch (error) {
    console.error("Error updating daily streak:", error);
    return { streak: 0, bonusPoints: 0 };
  }
}

/**
 * Process rent payment for gamification
 */
export async function processRentPayment(
  userAddress: string,
  paymentAmount: number,
  isOnTime: boolean,
  propertyId: number
): Promise<{ pointsAwarded: number; achievementsUnlocked: string[] }> {
  try {
    const basePoints = isOnTime ? POINT_RULES.RENT_PAYMENT_ON_TIME : POINT_RULES.RENT_PAYMENT_ON_TIME * 0.5;
    
    const result = await awardPoints(userAddress, 'rent_payment', basePoints, {
      paymentAmount,
      isOnTime,
      propertyId
    });

    // Check for achievements
    const achievementsUnlocked: string[] = [];
    
    // First payment achievement
    const userHistory = await getPointHistory(userAddress, 1000);
    const rentPayments = userHistory.filter(tx => tx.description.includes('pagamento'));
    
    if (rentPayments.length === 1) {
      await unlockAchievement(userAddress, 'first_payment');
      achievementsUnlocked.push('first_payment');
    }

    return {
      pointsAwarded: basePoints,
      achievementsUnlocked
    };
  } catch (error) {
    console.error("Error processing rent payment:", error);
    return { pointsAwarded: 0, achievementsUnlocked: [] };
  }
}

/**
 * Process token purchase for gamification
 */
export async function processTokenPurchase(
  userAddress: string,
  tokenAmount: number,
  propertyId: number
): Promise<{ pointsAwarded: number; achievementsUnlocked: string[] }> {
  try {
    const points = tokenAmount * POINT_RULES.TOKEN_PURCHASE;
    
    const result = await awardPoints(userAddress, 'token_purchase', points, {
      tokenAmount,
      propertyId
    });

    const achievementsUnlocked: string[] = [];

    // Check for token collector achievement
    if (tokenAmount >= 100) {
      await unlockAchievement(userAddress, 'token_collector');
      achievementsUnlocked.push('token_collector');
    }

    return {
      pointsAwarded: points,
      achievementsUnlocked
    };
  } catch (error) {
    console.error("Error processing token purchase:", error);
    return { pointsAwarded: 0, achievementsUnlocked: [] };
  }
}

/**
 * Calculate level from points
 */
export function calculateLevel(points: number): { level: number; levelName: string; color: string; nextLevelPoints?: number } {
  const safePoints = isNaN(points) || points < 0 ? 0 : points;
  
  const currentLevel = LEVELS.reduce((prev, current) => 
    safePoints >= current.minPoints ? current : prev
  );
  
  const nextLevel = LEVELS.find(level => level.level === currentLevel.level + 1);
  
  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    color: currentLevel.color,
    nextLevelPoints: nextLevel?.minPoints
  };
}

/**
 * Calculate claimable bonus tokens
 */
export function calculateClaimableTokens(points: number, level: number): number {
  const safePoints = isNaN(points) || points < 0 ? 0 : points;
  const safeLevel = isNaN(level) || level < 1 ? 1 : level;
  
  const levelData = LEVELS.find(l => l.level === safeLevel) || LEVELS[0];
  const tokens = Math.floor(safePoints / 100) * levelData.tokenMultiplier;
  
  return isNaN(tokens) ? 0 : Math.max(0, tokens);
}

/**
 * Mock data for development
 */
export const mockGameData = {
  generateMockUser: (address: string, profile: 'renter' | 'investor'): GameUser => {
    const totalPoints = Math.floor(Math.random() * 10000) + 500;
    const level = Math.floor(Math.random() * 3) + 1;
    const levelNames = ['Bronze', 'Prata', 'Ouro'];
    
    return {
      address,
      totalPoints: isNaN(totalPoints) ? 500 : totalPoints,
      level: isNaN(level) ? 1 : level,
      levelName: levelNames[Math.min(level - 1, levelNames.length - 1)] || 'Bronze',
      fmzTokenBalance: Math.floor(Math.random() * 1000) || 0,
      claimableTokens: Math.floor(Math.random() * 50) || 0,
      achievements: [],
      dailyStreak: Math.floor(Math.random() * 30) + 1 || 1,
      lastActivity: new Date(),
      profile,
      monthlyChallenge: null
    };
  },

  generateMockLeaderboard: (count: number): LeaderboardEntry[] => {
    const safeCount = isNaN(count) || count < 1 ? 10 : Math.min(count, 1000);
    
    return Array.from({ length: safeCount }, (_, i) => {
      const totalPoints = Math.floor(Math.random() * 100000) || 0;
      const level = Math.floor(Math.random() * 5) + 1;
      const levelIndex = Math.min(Math.max(level - 1, 0), LEVELS.length - 1);
      
      return {
        rank: i + 1,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        displayName: `User ${i + 1}`,
        totalPoints: isNaN(totalPoints) ? 0 : totalPoints,
        level: isNaN(level) ? 1 : level,
        levelName: LEVELS[levelIndex]?.name || 'Bronze',
        achievementCount: Math.floor(Math.random() * 20) || 0,
        monthlyPoints: Math.floor(Math.random() * 1000) || 0,
        avatar: ['🧑‍💼', '👨‍💼', '👩‍💼', '🤵', '💎', '🎯'][Math.floor(Math.random() * 6)] || '🧑‍💼',
        profile: (Math.random() > 0.5 ? 'investor' : 'renter') as 'investor' | 'renter'
      };
    }).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }
}; 