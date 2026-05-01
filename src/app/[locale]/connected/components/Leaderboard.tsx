"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';

interface LeaderboardEntry {
  id: string;
  address: string;
  displayName: string;
  totalPoints: number;
  level: number;
  levelName: string;
  achievements: number;
  monthlyGrowth: number;
  avatar: string;
  profile: 'renter' | 'investor';
  isCurrentUser?: boolean;
}

interface Props {
  currentUserAddress: string;
  currentUserProfile: 'renter' | 'investor';
}

const LEVELS = [
  { level: 1, name: 'Bronze', minPoints: 0, color: '#CD7F32' },
  { level: 2, name: 'Prata', minPoints: 1000, color: '#C0C0C0' },
  { level: 3, name: 'Ouro', minPoints: 5000, color: '#FFD700' },
  { level: 4, name: 'Platina', minPoints: 15000, color: '#E5E4E2' },
  { level: 5, name: 'Diamante', minPoints: 50000, color: '#B9F2FF' }
];

export default function Leaderboard({ currentUserAddress, currentUserProfile }: Props) {
  const t = useTranslations('Leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'renter' | 'investor'>('all');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedTab, timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Simulate API call - in production, this would fetch from backend
      const mockData: LeaderboardEntry[] = [
        {
          id: '1',
          address: currentUserAddress,
          displayName: 'Você',
          totalPoints: 2150,
          level: 2,
          levelName: 'Prata',
          achievements: 3,
          monthlyGrowth: 450,
          avatar: '🧑‍💼',
          profile: currentUserProfile,
          isCurrentUser: true
        },
        {
          id: '2',
          address: '0x742d35Cc6634C0532925a3b8D1000C46fB0ab9c1',
          displayName: 'Investidor Pro',
          totalPoints: 8750,
          level: 3,
          levelName: 'Ouro',
          achievements: 12,
          monthlyGrowth: 1200,
          avatar: '👨‍💼',
          profile: 'investor'
        },
        {
          id: '3',
          address: '0x8ba1f109551bD432803012645Hac136c04x2345',
          displayName: 'Renter Master',
          totalPoints: 5420,
          level: 3,
          levelName: 'Ouro',
          achievements: 8,
          monthlyGrowth: 680,
          avatar: '👩‍💼',
          profile: 'renter'
        },
        {
          id: '4',
          address: '0x9cd2f140253c3d8b2fE6c2f83Bc5e3d4A9B8C7D6',
          displayName: 'Crypto Landlord',
          totalPoints: 12300,
          level: 4,
          levelName: 'Platina',
          achievements: 15,
          monthlyGrowth: 890,
          avatar: '🤵',
          profile: 'investor'
        },
        {
          id: '5',
          address: '0x5ef7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5',
          displayName: 'Token Collector',
          totalPoints: 3890,
          level: 2,
          levelName: 'Prata',
          achievements: 6,
          monthlyGrowth: 320,
          avatar: '🎯',
          profile: 'renter'
        },
        {
          id: '6',
          address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          displayName: 'Diamond Hands',
          totalPoints: 67890,
          level: 5,
          levelName: 'Diamante',
          achievements: 25,
          monthlyGrowth: 2100,
          avatar: '💎',
          profile: 'investor'
        }
      ];

      // Sort by points descending
      const sortedData = mockData.sort((a, b) => b.totalPoints - a.totalPoints);

      // Filter by profile if needed
      const filteredData = selectedTab === 'all' 
        ? sortedData 
        : sortedData.filter(entry => entry.profile === selectedTab);

      setLeaderboard(filteredData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
    }
  };

  const formatPoints = (points: number): string => {
    if (isNaN(points) || points < 0) return '0';
    
    if (points >= 1000000) {
      const formatted = (points / 1000000).toFixed(1);
      return isNaN(parseFloat(formatted)) ? '0M' : `${formatted}M`;
    }
    if (points >= 1000) {
      const formatted = (points / 1000).toFixed(1);
      return isNaN(parseFloat(formatted)) ? '0K' : `${formatted}K`;
    }
    return Math.floor(points).toString();
  };

  const getPositionIcon = (position: number): string => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getProfileBadge = (profile: 'renter' | 'investor'): { icon: string; color: string; text: string } => {
    return profile === 'renter' 
      ? { icon: '🏠', color: 'bg-blue-100 text-blue-800', text: 'Locatário' }
      : { icon: '📈', color: 'bg-green-100 text-green-800', text: 'Investidor' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏆 Ranking</h2>
        <div className="text-sm text-gray-500">
          Atualizado agora
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Profile Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              selectedTab === 'all'
                ? 'bg-purple-700 text-white shadow-lg border-2 border-purple-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedTab('renter')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              selectedTab === 'renter'
                ? 'bg-blue-700 text-white shadow-lg border-2 border-blue-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            🏠 Locatários
          </button>
          <button
            onClick={() => setSelectedTab('investor')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              selectedTab === 'investor'
                ? 'bg-green-700 text-white shadow-lg border-2 border-green-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            📈 Investidores
          </button>
        </div>

        {/* Time Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
              timeFilter === 'week'
                ? 'bg-purple-700 text-white shadow-lg border-2 border-purple-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
              timeFilter === 'month'
                ? 'bg-purple-700 text-white shadow-lg border-2 border-purple-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-purple-700 text-white shadow-lg border-2 border-purple-800'
                : 'text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Top 3</h3>
        <div className="grid grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const level = LEVELS.find(l => l.level === entry.level) || LEVELS[0];
            const profileBadge = getProfileBadge(entry.profile);
            
            return (
              <div 
                key={entry.id}
                className={`text-center p-4 rounded-xl border-2 ${
                  entry.isCurrentUser 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50'
                } ${index === 0 ? 'relative transform scale-105' : ''}`}
              >
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    👑
                  </div>
                )}
                
                <div className="text-3xl mb-2">{getPositionIcon(index + 1)}</div>
                <div className="text-2xl mb-1">{entry.avatar}</div>
                <div className="font-bold text-sm text-gray-800 mb-1 truncate">
                  {entry.displayName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </div>
                
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <span className="text-xs font-bold" style={{ color: level.color }}>
                    {entry.levelName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${profileBadge.color}`}>
                    {profileBadge.icon}
                  </span>
                </div>
                
                <div className="text-lg font-bold text-purple-600">
                  {formatPoints(entry.totalPoints)}
                </div>
                <div className="text-xs text-gray-500">pontos</div>
                
                {entry.monthlyGrowth > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    +{entry.monthlyGrowth} este mês
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Ranking */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Ranking Completo</h3>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const level = LEVELS.find(l => l.level === entry.level) || LEVELS[0];
            const profileBadge = getProfileBadge(entry.profile);
            
            return (
              <div 
                key={entry.id}
                className={`flex items-center p-4 rounded-xl border ${
                  entry.isCurrentUser 
                    ? 'border-purple-300 bg-purple-50 shadow-md' 
                    : 'border-gray-200 bg-gray-50'
                } hover:shadow-lg transition-all duration-200`}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mr-4">
                  <span className="text-xl">
                    {index < 3 ? getPositionIcon(index + 1) : `#${index + 1}`}
                  </span>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center flex-1 min-w-0">
                  <div className="text-3xl mr-3">{entry.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-800 truncate">
                        {entry.displayName}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {entry.address.slice(0, 10)}...{entry.address.slice(-6)}
                    </div>
                  </div>
                </div>

                {/* Level & Profile */}
                <div className="flex flex-col items-center mr-4">
                  <span className="text-sm font-bold" style={{ color: level.color }}>
                    {entry.levelName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${profileBadge.color}`}>
                    {profileBadge.text}
                  </span>
                </div>

                {/* Achievements */}
                <div className="flex flex-col items-center mr-4">
                  <span className="text-sm font-bold text-gray-800">
                    {entry.achievements}
                  </span>
                  <span className="text-xs text-gray-500">conquistas</span>
                </div>

                {/* Points */}
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-purple-600">
                    {formatPoints(entry.totalPoints)}
                  </span>
                  <span className="text-xs text-gray-500">pontos</span>
                  {entry.monthlyGrowth > 0 && (
                    <span className="text-xs text-green-600">
                      +{entry.monthlyGrowth}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            💡 Dica: Ganhe mais pontos fazendo pagamentos em dia, adquirindo tokens e completando desafios!
          </div>
          <div className="text-xs text-gray-500">
            O ranking é atualizado em tempo real com base na atividade dos usuários.
          </div>
        </div>
      </div>
    </div>
  );
} 