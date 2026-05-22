"use client";

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import { useRouter } from "next/navigation";

import { 
  Activity, 
  DollarSign, 
  Hash, 
  Calendar,
  Filter,
  TrendingUp,
  Wallet,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { getMonitoring } from "../../../../services/web3Admin-api";
import { useProfile } from '../../../context/ProfileContext';

// Type definitions
interface CardProps {
  children: ReactNode;
  className?: string;
}

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive';
}

interface Transaction {
  transactionHash: string;
  functionName: string;
  gasUsed: string;
  gasPrice: string;
  gasCost: string;
  gasCostFormatted: {
    wei: string;
    ether: string;
    native: {
      amount: string;
      symbol: string;
      network: string;
    };
    usd: {
      amount: string;
      price: number;
      currency: string;
    };
  };
  date: string;
  timestamp: string;
  status: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
}

interface ContractData {
  CONTRACT_ADDRESS: string;
  totalTransactions: number;
  searchType: string;
  network: {
    name: string;
    symbol: string;
    priceKey: string;
  };
  contractCreationBlock: number;
  summary: {
    totalGasCost: {
      native: {
        amount: string;
        symbol: string;
      };
      usd: {
        amount: string;
        currency: string;
      };
    };
    functionStats: Array<{
      functionName: string;
      transactionCount: number;
      totalGasCost: {
        native: {
          amount: string;
          symbol: string;
        };
        usd: {
          amount: string;
          currency: string;
        };
      };
    }>;
  };
  transactions: Transaction[];
}

// Componentes personalizados
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<CardProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<BadgeProps> = ({ children, className = "", variant = "default" }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    destructive: "bg-red-100 text-red-800 border-red-200"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const AdminGas: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const router = useRouter();
  const { profile } = useProfile();
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  const filteredTransactions = useMemo(() => {
    if (!contractData?.transactions) return [];
    if (selectedFunction === 'all') return contractData.transactions;
    return contractData.transactions.filter(tx => tx.functionName === selectedFunction);
  }, [selectedFunction, contractData]);

  const displayedTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);

  const formatAddress = (address: string): string => {
    if (!address) return 'Contract Creation';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Função para formatar nome da função
  const formatFunctionName = (functionName: string): string => {
    if (functionName.toLowerCase().includes('unknown') && functionName.includes('0x')) {
      return 'deploy';
    }
    return functionName;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getFunctionColor = (functionName: string): string => {
    const colors: Record<string, string> = {
      'createInvoice': 'bg-blue-100 text-blue-800 border-blue-200',
      'receiveRentalPayment': 'bg-green-100 text-green-800 border-green-200',
      'purchaseTokens': 'bg-purple-100 text-purple-800 border-purple-200',
      'createMaintenance': 'bg-orange-100 text-orange-800 border-orange-200',
      'mintProperty': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'deploy': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Unknown': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    // Verifica se é deploy (Unknown com código hex)
    if (functionName.toLowerCase().includes('unknown') && functionName.includes('0x')) {
      return colors.deploy;
    }
    
    for (const [key, value] of Object.entries(colors)) {
      if (functionName.toLowerCase().includes(key.toLowerCase())) return value;
    }
    return colors.Unknown;
  };

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet && !wallet) {
      setWallet(storedWallet);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getMonitoring();

        if (response?.request.status != 200|| !response?.data) {
          setMessage("Não há dados disponíveis");
        } else {
          setContractData(response.data);
          setMessage(null);
        }
      } catch (err) {
        console.error("Erro carregando dados da API:", err);
        setMessage("Erro ao carregar dados da API");
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet, profile]);

  const handleBackNavigation = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dados do contrato...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (message && !contractData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-gray-600 text-lg">{message}</p>
                <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
                    &larr; Voltar
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render - só renderiza se tiver dados
  if (!contractData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Monitor de Gas</h1>
            <p className="text-gray-600 mt-1">
              Análise de custos de gas para o contrato {formatAddress(contractData.CONTRACT_ADDRESS)}
            </p>
          </div>
            <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
                &larr; Voltar
            </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Transações
              </CardTitle>
              <Hash className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {contractData.totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gas Total ({contractData.network.symbol})
              </CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {contractData.summary.totalGasCost.native.amount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {contractData.summary.totalGasCost.native.symbol}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valor Total (USD)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                ${contractData.summary.totalGasCost.usd.amount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {contractData.summary.totalGasCost.usd.currency}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rede
              </CardTitle>
              <Wallet className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 capitalize">
                {contractData.network.name}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {contractData.network.symbol}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Function Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Estatísticas por Função</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractData.summary.functionStats.map((stat, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getFunctionColor(stat.functionName)}>
                      {formatFunctionName(stat.functionName)}
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">
                      {stat.transactionCount}x
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Gas: {stat.totalGasCost.native.amount} {stat.totalGasCost.native.symbol}
                    </div>
                    <div className="text-sm text-gray-600">
                      USD: ${stat.totalGasCost.usd.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter and Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Histórico de Transações</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedFunction}
                  onChange={(e) => setSelectedFunction(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as funções</option>
                  {contractData.summary.functionStats.map((stat) => (
                    <option key={stat.functionName} value={stat.functionName}>
                      {formatFunctionName(stat.functionName)} ({stat.transactionCount})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedTransactions.map((tx, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge className={getFunctionColor(tx.functionName)}>
                        {formatFunctionName(tx.functionName)}
                      </Badge>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        tx.status === 'Success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(tx.date)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hash:</span>
                      <div className="text-xs mt-1 flex items-center space-x-1">
                        <span>{formatAddress(tx.transactionHash)}</span>
                        {/* <ExternalLink className="h-3 w-3 text-gray-400" /> */}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">De/Para:</span>
                      <div className="text-xs mt-1">
                        {formatAddress(tx.from)} → {formatAddress(tx.to)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Gas:</span>
                      <div className="mt-1">
                        <div className="text-xs">
                          {tx.gasCostFormatted.native.amount} {tx.gasCostFormatted.native.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${tx.gasCostFormatted.usd.amount} USD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTransactions.length > 5 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="flex items-center text-white text-xl space-x-2 mx-auto px-4 py-2 text-blue-600 hover:text-white transition-colors"
                >
                  <span>
                    {showAllTransactions 
                      ? `Mostrar menos` 
                      : `Mostrar todas (${filteredTransactions.length - 5} restantes)`
                    }
                  </span>
                  {showAllTransactions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGas;