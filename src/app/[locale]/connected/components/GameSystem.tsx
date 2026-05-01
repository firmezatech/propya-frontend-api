"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { PropertyData, RentDetailData, InvestorData } from "../../../../services/web3-api";

// Types for Game System
export interface GameData {
  userId: string;
  totalPoints: number;
  level: number;
  levelName: string;
  fmzTokens: number; // Bonus tokens to claim
  achievements: Achievement[];
  dailyStreak: number;
  monthlyChallenge: MonthlyChallenge;
  lastActivity: Date;
  pointsHistory: PointsHistory[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: Date;
  category: 'payment' | 'investment' | 'engagement' | 'milestone';
}

export interface MonthlyChallenge {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  completed: boolean;
}

export interface PointsHistory {
  id: string;
  action: string;
  points: number;
  date: Date;
  details: string;
}

interface Props {
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  investorDetail: InvestorData | null;
  userAddress: string;
  profile: 'renter' | 'investor';
}

const LEVELS = [
  { level: 1, name: 'Bronze', minPoints: 0, color: '#CD7F32', tokenMultiplier: 1 },
  { level: 2, name: 'Prata', minPoints: 1000, color: '#C0C0C0', tokenMultiplier: 1.2 },
  { level: 3, name: 'Ouro', minPoints: 5000, color: '#FFD700', tokenMultiplier: 1.5 },
  { level: 4, name: 'Platina', minPoints: 15000, color: '#E5E4E2', tokenMultiplier: 2 },
  { level: 5, name: 'Diamante', minPoints: 50000, color: '#B9F2FF', tokenMultiplier: 3 }
];

export default function GameSystem({
  rentDetail,
  propertyDetail,
  investorDetail,
  userAddress,
  profile
}: Props) {
  const t = useTranslations('GameSystem');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    loadGameData();
  }, [userAddress]);

  const loadGameData = async () => {
    try {
      // Simulate loading game data - in production, this would be from API
      const mockGameData: GameData = {
        userId: userAddress,
        totalPoints: calculateTotalPoints(),
        level: 1,
        levelName: 'Bronze',
        fmzTokens: calculateClaimableTokens(),
        achievements: generateAchievements(),
        dailyStreak: 5,
        monthlyChallenge: generateMonthlyChallenge(),
        lastActivity: new Date(),
        pointsHistory: generatePointsHistory()
      };

      // Calculate current level
      const currentLevel = LEVELS.reduce((prev, current) => 
        mockGameData.totalPoints >= current.minPoints ? current : prev
      );
      mockGameData.level = currentLevel.level;
      mockGameData.levelName = currentLevel.name;

      setGameData(mockGameData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game data:', error);
      setLoading(false);
    }
  };

  const calculateTotalPoints = (): number => {
    let points = 0;
    
    if (profile === 'renter' && rentDetail) {
      // Points for on-time payments
      points += 100; // Base points for having active rent
      
      // Points for token purchases
      const tokensPurchased = Number(rentDetail.tokensToBuy) || 0;
      if (!isNaN(tokensPurchased)) {
        points += tokensPurchased * 10;
      }
      
      // Bonus for low rent (more property ownership)
      const rentReductionStr = rentDetail.percentBuyer || '0';
      const rentReduction = parseFloat(rentReductionStr.replace('%', '').replace(',', '.'));
      if (!isNaN(rentReduction)) {
        points += Math.floor(rentReduction * 100);
      }
    }
    
    if (profile === 'investor' && investorDetail) {
      // Points for investment amount
      const capitalValueStr = investorDetail.capitalValue || '0';
      const investmentValue = parseFloat(capitalValueStr.replace('R$', '').replace(',', '.').trim());
      if (!isNaN(investmentValue)) {
        points += Math.floor(investmentValue / 100);
      }
      
      // Points for participation percentage
      const participation = Number(investorDetail.percentageInvestedNumber) || 0;
      if (!isNaN(participation)) {
        points += Math.floor(participation * 1000);
      }
      
      // Points for rent yield
      const yieldValueStr = investorDetail.rentYield || '0';
      const yieldValue = parseFloat(yieldValueStr.replace('R$', '').replace(',', '.').trim());
      if (!isNaN(yieldValue)) {
        points += Math.floor(yieldValue / 10);
      }
    }

    const finalPoints = Math.max(points, 150); // Minimum points for demo
    return isNaN(finalPoints) ? 150 : finalPoints;
  };

  const calculateClaimableTokens = (): number => {
    const points = calculateTotalPoints();
    if (isNaN(points) || points < 0) return 0;
    
    const currentLevel = LEVELS.find(l => points >= l.minPoints) || LEVELS[0];
    const tokens = Math.floor(points / 100) * currentLevel.tokenMultiplier;
    return isNaN(tokens) ? 0 : Math.max(tokens, 0);
  };

  const generateAchievements = (): Achievement[] => {
    const achievements: Achievement[] = [
      {
        id: 'first_payment',
        name: 'Primeiro Pagamento',
        description: 'Realize seu primeiro pagamento de aluguel',
        icon: '💰',
        points: 100,
        unlocked: true,
        unlockedDate: new Date(),
        category: 'payment'
      },
      {
        id: 'token_collector',
        name: 'Colecionador de Tokens',
        description: 'Adquira mais de 100 tokens',
        icon: '🏆',
        points: 500,
        unlocked: profile === 'renter' && (rentDetail?.tokensToBuy || 0) > 100,
        category: 'investment'
      },
      {
        id: 'property_owner',
        name: 'Proprietário',
        description: 'Possua mais de 10% de uma propriedade',
        icon: '🏠',
        points: 1000,
        unlocked: false,
        category: 'milestone'
      },
      {
        id: 'rent_master',
        name: 'Mestre do Aluguel',
        description: 'Reduza seu aluguel em mais de 50%',
        icon: '👑',
        points: 2000,
        unlocked: profile === 'renter' && !isNaN(parseFloat(rentDetail?.percentBuyer?.replace('%', '').replace(',', '.') || '0')) && parseFloat(rentDetail?.percentBuyer?.replace('%', '').replace(',', '.') || '0') > 50,
        category: 'milestone'
      },
      {
        id: 'investor_pro',
        name: 'Investidor Profissional',
        description: 'Mantenha investimentos por mais de 1 ano',
        icon: '📈',
        points: 1500,
        unlocked: profile === 'investor',
        category: 'engagement'
      }
    ];

    return achievements;
  };

  const generateMonthlyChallenge = (): MonthlyChallenge => {
    if (profile === 'renter') {
      return {
        id: 'monthly_tokens',
        name: 'Desafio de Tokens',
        description: 'Adquira 50 tokens este mês',
        targetValue: 50,
        currentValue: rentDetail?.tokensToBuy || 0,
        reward: 500,
        completed: (rentDetail?.tokensToBuy || 0) >= 50
      };
    } else {
      return {
        id: 'monthly_yield',
        name: 'Desafio de Rendimento',
        description: 'Alcance R$ 500 em rendimentos este mês',
        targetValue: 500,
        currentValue: (() => {
          const valueStr = investorDetail?.nextRentPaymentCurrency?.replace('R$', '').replace(',', '.').trim() || '0';
          const value = parseFloat(valueStr);
          return isNaN(value) ? 0 : value;
        })(),
        reward: 300,
        completed: false
      };
    }
  };

  const generatePointsHistory = (): PointsHistory[] => {
    return [
      {
        id: '1',
        action: 'Pagamento realizado',
        points: 100,
        date: new Date(),
        details: 'Pagamento de aluguel em dia'
      },
      {
        id: '2',
        action: 'Tokens adquiridos',
        points: 50,
        date: new Date(Date.now() - 86400000),
        details: '5 tokens adquiridos'
      }
    ];
  };

  const claimTokens = async () => {
    if (!gameData) return;
    
    try {
      // In production, this would call the blockchain contract
      setGameData({
        ...gameData,
        fmzTokens: 0,
        totalPoints: gameData.totalPoints + 100 // Bonus for claiming
      });
      setShowClaimModal(false);
      alert(`Parabéns! Você recebeu ${gameData.fmzTokens} FMZ Tokens!`);
    } catch (error) {
      console.error('Error claiming tokens:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!gameData) return null;

  const currentLevel = LEVELS.find(l => l.level === gameData.level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === gameData.level + 1);
  
  const progressToNext = nextLevel ? (() => {
    const currentPoints = gameData.totalPoints || 0;
    const currentMin = currentLevel.minPoints || 0;
    const nextMin = nextLevel.minPoints || 0;
    
    if (nextMin <= currentMin) return 100;
    
    const progress = ((currentPoints - currentMin) / (nextMin - currentMin)) * 100;
    return Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  })() : 100;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🎮 Sistema de Recompensas</h2>
        {gameData.fmzTokens > 0 && (
          <button
            onClick={() => setShowClaimModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          >
            🎁 Resgatar {gameData.fmzTokens} Tokens
          </button>
        )}
      </div>

      {/* Level and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Nível Atual</span>
            <span className="text-2xl">👑</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: currentLevel.color }}>
            {gameData.levelName}
          </div>
          <div className="text-sm text-gray-500">{isNaN(gameData.totalPoints) ? 0 : Math.floor(gameData.totalPoints)} pontos</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Sequência Diária</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {isNaN(gameData.dailyStreak) ? 0 : Math.floor(gameData.dailyStreak)} dias
          </div>
          <div className="text-sm text-gray-500">Continue assim!</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">FMZ Tokens</span>
            <span className="text-2xl">💎</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {isNaN(gameData.fmzTokens) ? 0 : Math.floor(gameData.fmzTokens)}
          </div>
          <div className="text-sm text-gray-500">Disponível para resgate</div>
        </div>
      </div>

      {/* Progress Bar */}
      {nextLevel && (
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progresso para {nextLevel.name}</span>
            <span className="text-sm text-gray-600">{isNaN(progressToNext) ? 0 : Math.floor(progressToNext)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
                      <div className="text-xs text-gray-500 mt-1">
            {Math.max(0, (nextLevel.minPoints || 0) - (gameData.totalPoints || 0))} pontos restantes
          </div>
        </div>
      )}

      {/* Monthly Challenge */}
      <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">🎯 Desafio do Mês</h3>
          <span className="text-sm text-purple-600 font-bold">+{gameData.monthlyChallenge.reward} pts</span>
        </div>
        <div className="mb-2">
          <span className="text-sm text-gray-600">{gameData.monthlyChallenge.description}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progresso</span>
          <span className="text-sm text-gray-600">
            {isNaN(gameData.monthlyChallenge.currentValue) ? 0 : Math.floor(gameData.monthlyChallenge.currentValue)}/{isNaN(gameData.monthlyChallenge.targetValue) ? 0 : Math.floor(gameData.monthlyChallenge.targetValue)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
            style={{ 
              width: `${(() => {
                const current = gameData.monthlyChallenge.currentValue || 0;
                const target = gameData.monthlyChallenge.targetValue || 1;
                const percentage = (current / target) * 100;
                return Math.min(isNaN(percentage) ? 0 : percentage, 100);
              })()}%` 
            }}
          ></div>
        </div>
        {gameData.monthlyChallenge.completed && (
          <div className="text-green-600 text-sm mt-2 font-bold">✅ Desafio Completo!</div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <h3 className="font-bold text-gray-800 mb-4">🏆 Conquistas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gameData.achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-3 rounded-lg border-2 ${
                achievement.unlocked 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <div className={`font-bold ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${achievement.unlocked ? 'text-green-600' : 'text-gray-400'}`}>
                  +{isNaN(achievement.points) ? 0 : Math.floor(achievement.points)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Resgatar Tokens!</h3>
              <p className="text-gray-600 mb-4">
                Você tem {gameData.fmzTokens} FMZ Tokens disponíveis para resgate.
                Estes tokens são bônus que você pode usar na plataforma!
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={claimTokens}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg"
                >
                  Resgatar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 