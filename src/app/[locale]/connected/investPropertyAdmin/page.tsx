'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Calendar, DollarSign, Wallet, Users } from 'lucide-react';
import { useWallet } from '../../../../hooks/useWallet';
import { useProfile } from '../../../context/ProfileContext';
import { getProperties, investInProperty, convertBrazilianDateToTimestamp, formatDateFromTimestamp, getInvestorList, InvestorData } from '../../../../services/web3-api';

interface Property {
  id: string;
  value: string;
}

interface InvestmentData {
  propertyId: string;
  paymentDate: string;
  value: number;
  address: string;
  customerType: 'investor' | 'legacy';
}

// Função para converter data ISO para formato brasileiro
const formatDateToBR = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

// Função para converter data brasileira para ISO
const formatDateToISO = (brDate: string): string => {
  if (!brDate || brDate.length !== 10) return '';
  const [day, month, year] = brDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export default function InvestPropertyAdminPage() {
  const router = useRouter();
  const { wallet } = useWallet();
  const { currentProfile } = useProfile();
  const t = useTranslations('InvestPropertyAdmin');
  
  // Estado para o profile local
  const [profile, setProfile] = useState<number | null>(null);
  // Estados para propriedades
  const [properties, setProperties] = useState<Property[]>([]);
  // Estados para investidores por propriedade
  const [investorsByProperty, setInvestorsByProperty] = useState<{[propertyId: string]: InvestorData[]}>({});
  const [loadingInvestors, setLoadingInvestors] = useState<boolean>(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentDateBR, setPaymentDateBR] = useState('');
  const [investmentDate, setInvestmentDate] = useState('');
  const [value, setValue] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [customerType, setCustomerType] = useState<'investor' | 'legacy'>('investor');
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [propertiesLoaded, setPropertiesLoaded] = useState<boolean>(false);

  // Inicializar profile do localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      setProfile(parseInt(savedProfile));
    } else if (currentProfile !== null) {
      setProfile(currentProfile);
    }
  }, [currentProfile]);

  // Verificar permissões de admin
  useEffect(() => {
    if (profile !== null) {
      if (profile !== 0) {
        setError(t('accessDenied'));
        return;
      } else {
        setError('');
      }
    }
  }, [profile, t]);

  // Função para carregar propriedades (versão corrigida e unificada)
  const loadPropertiesIfNeeded = useCallback(async () => {
    if (!wallet || profile !== 0) {
      console.log('⚠️ Não é possível carregar propriedades. Wallet:', wallet, 'Profile:', profile);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Carregando propriedades admin...', { wallet, profile });
      
      const propertiesData = await getProperties();
      
      if (propertiesData && Array.isArray(propertiesData) && propertiesData.length > 0) {
        setProperties(propertiesData);
        setSelectedPropertyId(propertiesData[0]?.id?.toString() || '');
        setPropertiesLoaded(true);
        console.log('✅ Propriedades carregadas:', propertiesData.length);
      } else {
        console.log('⚠️ Nenhuma propriedade encontrada');
        setProperties([]);
        setError(t('noPropertiesAvailable'));
        setPropertiesLoaded(true);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar propriedades:', error);
      setError(t('errorLoadingProperties'));
      setProperties([]);
      setPropertiesLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [wallet, profile, t]);

  // Função para carregar investidores por propriedade
  const loadInvestorsByProperty = useCallback(async () => {
    if (!wallet || profile !== 0 || properties.length === 0) {
      console.log('⚠️ Não é possível carregar investidores. Wallet:', wallet, 'Profile:', profile, 'Properties:', properties.length);
      return;
    }

    try {
      setLoadingInvestors(true);
      console.log('🔄 Carregando investidores por propriedade...');
      
      const investorsData: {[propertyId: string]: InvestorData[]} = {};
      
      // Carregar investidores para cada propriedade
      for (const property of properties) {
        try {
          const propertyInvestors = await getInvestorList(parseInt(property.id));
          if (propertyInvestors && propertyInvestors.length > 0) {
            investorsData[property.id] = propertyInvestors;
            console.log(`✅ Carregados ${propertyInvestors.length} investidores para propriedade ${property.id}`);
          } else {
            investorsData[property.id] = [];
            console.log(`⚠️ Nenhum investidor encontrado para propriedade ${property.id}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao carregar investidores da propriedade ${property.id}:`, error);
          investorsData[property.id] = [];
        }
      }
      
      setInvestorsByProperty(investorsData);
      console.log('✅ Investidores carregados por propriedade:', Object.keys(investorsData).length, 'propriedades');
    } catch (error) {
      console.error('❌ Erro ao carregar investidores por propriedade:', error);
      setError('Erro ao carregar investidores');
    } finally {
      setLoadingInvestors(false);
    }
  }, [wallet, profile, properties]);

  // Carregar propriedades quando wallet e profile estiverem prontos
  useEffect(() => {
    if (wallet && profile === 0) {
      console.log('🚀 Iniciando carregamento de propriedades...');
      loadPropertiesIfNeeded();
    }
  }, [wallet, profile, loadPropertiesIfNeeded]);

  // Carregar investidores quando propriedades estiverem carregadas
  useEffect(() => {
    if (propertiesLoaded && properties.length > 0 && wallet && profile === 0) {
      console.log('🚀 Iniciando carregamento de investidores por propriedade...');
      loadInvestorsByProperty();
    }
  }, [propertiesLoaded, properties, wallet, profile, loadInvestorsByProperty]);

  // Função para renderizar seleção de propriedades
  const renderPropertySelection = () => {
    if (!propertiesLoaded) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('property')}
          </label>
          <div className="text-sm text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            {t('loadingProperties')}...
          </div>
        </div>
      );
    }

    if (!Array.isArray(properties) || properties.length === 0) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('property')}
          </label>
          <div className="text-sm text-red-500">
            {t('noPropertiesAvailable')}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('property')}
        </label>
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id.toString()}>
              {property.value}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Função para renderizar investidores por propriedade
  const renderInvestorsByProperty = () => {
    if (loadingInvestors) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Investidores por Propriedade</h2>
          <div className="text-sm text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Carregando investidores...
          </div>
        </div>
      );
    }

    if (Object.keys(investorsByProperty).length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Investidores por Propriedade</h2>
          <div className="text-sm text-gray-500">
            Nenhum investidor encontrado
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Investidores por Propriedade</h2>
          
          <div className="space-y-6">
            {properties.map((property) => {
              const propertyInvestors = investorsByProperty[property.id] || [];
              
              return (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">
                      {property.value}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {propertyInvestors.length} investidor{propertyInvestors.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  {propertyInvestors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {propertyInvestors.map((investor, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {investor.profile === 1 ? 'Proprietario' : investor.profile === 2 ? 'Inquilino' : investor.profile === 3 ? 'Investidor' : investor.profile === 4 ? 'Legado' : 'Outro'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {investor.investorAddress.slice(0, 15)}...{investor.investorAddress.slice(-4)}
                          </p>
                          {/* <p className="text-xs text-gray-600 mb-1">
                            Valor: {investor.capitalValue}
                          </p> */}
                          <p className="text-xs text-gray-600 mb-1">
                            Participação: {investor.percentageInvested}
                          </p>
                          {/* <p className="text-xs text-gray-600">
                            Próximo Pagamento: {investor.nextRentPaymentCurrency}
                          </p> */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Nenhum investidor nesta propriedade
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    return parseFloat(numbers) / 100;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrency(inputValue);
    setValue(formatted);
  };

  const validateForm = () => {
    if (!selectedPropertyId) {
      setError(t('selectProperty'));
      return false;
    }
    if (!paymentDateBR || paymentDateBR.length !== 10) {
      setError(t('selectDate'));
      return false;
    }
    if (!value.trim()) {
      setError(t('enterValue'));
      return false;
    }
    if (!address.trim()) {
      setError(t('enterAddress'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    if (!wallet) {
      setMessage("Carteira não conectada");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setIsSubmitting(true);
      
      const timestamp = convertBrazilianDateToTimestamp(paymentDateBR);
      
      const investmentData: InvestmentData = {
        propertyId: selectedPropertyId,
        paymentDate: timestamp.toString(),
        value: parseCurrency(value),
        address: address.trim(),
        customerType
      };

      const isLegacy = customerType === 'legacy';

      const result = await investInProperty({
        propertyId: parseInt(investmentData.propertyId),
        investorAddress: investmentData.address,
        investmentValue: investmentData.value,
        investmentDate: investmentData.paymentDate,
        isLegacyClient: isLegacy
      });

      if (result.success) {
        setSuccess(t('investmentSuccess'));
        setMessage("Investimento realizado com sucesso!");
        
        // Limpar formulário
        setSelectedPropertyId('');
        setPaymentDate('');
        setPaymentDateBR('');
        setValue('');
        setAddress('');
        setCustomerType('investor');
        setShowForm(false);
        setShowConfirmDialog(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao realizar investimento";
      setError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (!wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">{t('walletRequired')}</p>
        </div>
      </div>
    );
  }

  if (profile !== 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">{error || t('adminOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="border rounded button-line">
            <ArrowLeft className="w-5 h-5" />
              </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
              <p className="text-gray-600">{t('pageDescription')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-sm">{t('newInvestmentButton')}</span>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Investors by Property */}
        <div className="mb-8">
          {renderInvestorsByProperty()}
        </div>

        {/* Investment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">{t('newInvestmentButton')}</h2>
              
              {/* Property and Customer Type - Same Line */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectProperty')}
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('selectProperty')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.value}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t('customerType')}
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as 'investor' | 'legacy')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="investor">{t('investor')}</option>
                    <option value="legacy">{t('legacy')}</option>
                  </select>
                </div>
              </div>

              {/* Payment Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('paymentDate')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => {
                      const isoDate = e.target.value;
                      setInvestmentDate(isoDate);
                      setPaymentDateBR(formatDateToBR(isoDate));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {paymentDateBR && (
                  <p className="text-sm text-gray-600 mt-1">
                    Data selecionada: {paymentDateBR}
                  </p>
                )}
              </div>

              {/* Value */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('value')}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={handleValueChange}
                  placeholder="R$ 0,00"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wallet className="w-4 h-4 inline mr-1" />
                  {t('address')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                <span className="text-sm">{t('cancel')}</span>
                </button>
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm">
                    {loading ? t('processing') : t('confirm')}
                  </span>                  
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">{t('confirmInvestment')}</h2>
              <div className="space-y-2 mb-6">
                <p><strong>{t('selectProperty')}:</strong> {properties.find(p => p.id === selectedPropertyId)?.value}</p>
                <p><strong>{t('customerType')}:</strong> {t(customerType)}</p>
                <p><strong>{t('paymentDate')}:</strong> {paymentDateBR}</p>
                <p><strong>{t('value')}:</strong> {value}</p>
                <p><strong>{t('address')}:</strong> {address}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm">{t('cancel')}</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm">
                    {loading ? t('processing') : t('confirm')}
                 </span> 
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        {/* <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t('availableProperties')}</h2>
            {renderPropertySelection()}
          </div>
        </div> */}
      </div>
    </div>
  );
}