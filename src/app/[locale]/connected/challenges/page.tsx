"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Types for Weekly Challenges
interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  progress: number;
  target: number;
  deadline: Date;
  completed: boolean;
  category: 'payment' | 'investment' | 'engagement' | 'social';
  icon: string;
  reward: {
    points: number;
    tokens?: number;
    badge?: string;
    nft?: string;
  };
}

export default function ChallengesPage() {
  const router = useRouter();
  const t = useTranslations("Challenges");
  const comm = useTranslations("Common");

  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'payment' | 'investment' | 'engagement' | 'social'>('all');
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletChange = () => {
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        setWallet(storedWallet);
      }
    };

    window.addEventListener('walletChanged', handleWalletChange);
    handleWalletChange();

    return () => {
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [wallet]);

  const loadChallenges = async () => {
    try {
      // Simulate loading challenges - in production, this would be from API
      const mockChallenges: WeeklyChallenge[] = [
        {
          id: 'weekly_payment_streak',
          title: 'Pagador Pontual',
          description: 'Faça seus pagamentos em dia por 7 dias consecutivos',
          instructions: [
            'Acesse a área de pagamentos no dashboard',
            'Efetue o pagamento do aluguel antes da data de vencimento',
            'Mantenha a sequência por 7 dias',
            'Receba pontos extras por cada dia em dia'
          ],
          difficulty: 'easy',
          points: 500,
          progress: 3,
          target: 7,
          deadline: getWeekEndDate(),
          completed: false,
          category: 'payment',
          icon: '💰',
          reward: {
            points: 500,
            tokens: 50,
            badge: 'Pagador Pontual'
          }
        },
        {
          id: 'token_investor',
          title: 'Colecionador de Tokens',
          description: 'Adquira 100 tokens do seu imóvel esta semana',
          instructions: [
            'Vá para a seção de investimentos',
            'Escolha a quantidade de tokens para comprar',
            'Complete a transação',
            'Acompanhe seu progresso em tempo real'
          ],
          difficulty: 'medium',
          points: 750,
          progress: 45,
          target: 100,
          deadline: getWeekEndDate(),
          completed: false,
          category: 'investment',
          icon: '🏆',
          reward: {
            points: 750,
            tokens: 75,
            nft: 'Token Collector NFT'
          }
        },
        {
          id: 'social_sharer',
          title: 'Embaixador Firmeza',
          description: 'Compartilhe sobre a Firmeza em 3 redes sociais diferentes',
          instructions: [
            'Acesse o painel de compartilhamento',
            'Escolha o conteúdo para compartilhar',
            'Publique no LinkedIn, Twitter e Instagram',
            'Use as hashtags sugeridas'
          ],
          difficulty: 'easy',
          points: 300,
          progress: 1,
          target: 3,
          deadline: getWeekEndDate(),
          completed: false,
          category: 'social',
          icon: '📱',
          reward: {
            points: 300,
            tokens: 30,
            badge: 'Embaixador'
          }
        },
        {
          id: 'portfolio_diversifier',
          title: 'Diversificador Pro',
          description: 'Invista em 2 propriedades diferentes esta semana',
          instructions: [
            'Explore o catálogo de propriedades',
            'Selecione uma segunda propriedade para investir',
            'Faça um investimento mínimo de R$ 100',
            'Complete o processo de verificação'
          ],
          difficulty: 'hard',
          points: 1200,
          progress: 0,
          target: 2,
          deadline: getWeekEndDate(),
          completed: false,
          category: 'investment',
          icon: '🏘️',
          reward: {
            points: 1200,
            tokens: 120,
            badge: 'Diversificador Pro',
            nft: 'Portfolio Master NFT'
          }
        },
        {
          id: 'engagement_master',
          title: 'Usuário Ativo',
          description: 'Faça login por 5 dias consecutivos e explore todas as seções',
          instructions: [
            'Faça login diário na plataforma',
            'Visite o dashboard de locatário/investidor',
            'Acesse a página de gamificação',
            'Visualize seus relatórios'
          ],
          difficulty: 'medium',
          points: 400,
          progress: 2,
          target: 5,
          deadline: getWeekEndDate(),
          completed: false,
          category: 'engagement',
          icon: '⚡',
          reward: {
            points: 400,
            tokens: 40,
            badge: 'Usuário Ativo'
          }
        }
      ];

      setChallenges(mockChallenges);
      setLoading(false);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setLoading(false);
    }
  };

  function getWeekEndDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return '💰';
      case 'investment': return '📈';
      case 'engagement': return '⚡';
      case 'social': return '📱';
      default: return '🎯';
    }
  };

  const getTimeRemaining = (deadline: Date): string => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(challenge => challenge.category === selectedCategory);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalPoints = challenges.reduce((sum, c) => sum + (c.completed ? c.points : 0), 0);

  if (!wallet) {
    return (
      <div className="container w-full">
        <main className="mt-4 mb-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-700 mb-2">
                {comm("pleaseLogin")}
              </h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container w-full">
        <main className="mt-4 mb-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/connected/gamification"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar à Gamificação
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-800">🎯 Desafios Semanais</h1>
          <p className="text-gray-600">Complete desafios e ganhe recompensas exclusivas</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Desafios Completos</p>
              <p className="text-2xl font-bold text-purple-600">{completedCount}/{challenges.length}</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pontos Ganhos</p>
              <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Restante</p>
              <p className="text-2xl font-bold text-orange-600">{getTimeRemaining(getWeekEndDate())}</p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-purple-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🎯 Todos
        </button>
        <button
          onClick={() => setSelectedCategory('payment')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            selectedCategory === 'payment'
              ? 'bg-green-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💰 Pagamentos
        </button>
        <button
          onClick={() => setSelectedCategory('investment')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            selectedCategory === 'investment'
              ? 'bg-blue-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📈 Investimentos
        </button>
        <button
          onClick={() => setSelectedCategory('engagement')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            selectedCategory === 'engagement'
              ? 'bg-yellow-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⚡ Engajamento
        </button>
        <button
          onClick={() => setSelectedCategory('social')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            selectedCategory === 'social'
              ? 'bg-pink-700 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📱 Social
        </button>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {filteredChallenges.map((challenge) => (
          <div 
            key={challenge.id}
            className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              challenge.completed 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            {/* Challenge Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{challenge.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{challenge.title}</h3>
                  <p className="text-gray-600 text-sm">{challenge.description}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty.toUpperCase()}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{challenge.progress}/{challenge.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    challenge.completed ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 mb-2">Como completar:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {challenge.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            {/* Rewards */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-gray-800 mb-2">🎁 Recompensas:</h4>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  +{challenge.reward.points} pontos
                </span>
                {challenge.reward.tokens && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    +{challenge.reward.tokens} FMZ tokens
                  </span>
                )}
                {challenge.reward.badge && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    🏅 {challenge.reward.badge}
                  </span>
                )}
                {challenge.reward.nft && (
                  <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                    🖼️ {challenge.reward.nft}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button & Status */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                ⏰ {getTimeRemaining(challenge.deadline)}
              </div>
              {challenge.completed ? (
                <div className="flex items-center text-green-600 font-bold">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Completo!
                </div>
              ) : (
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:shadow-lg transition-all duration-300">
                  Iniciar Desafio
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">💡 Dicas para Completar Desafios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">🎯 Estratégias Eficazes</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Foque nos desafios fáceis primeiro para ganhar momentum</li>
              <li>• Configure lembretes para não perder prazos</li>
              <li>• Combine desafios similares para máxima eficiência</li>
              <li>• Acompanhe seu progresso diariamente</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">🚀 Maximize suas Recompensas</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Complete desafios antes do prazo para bônus extra</li>
              <li>• Participe de desafios sociais para engajamento</li>
              <li>• Use tokens ganhos para acelerar outros desafios</li>
              <li>• Colete NFTs exclusivos dos desafios difíceis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 