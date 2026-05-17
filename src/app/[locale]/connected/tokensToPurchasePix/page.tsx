"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Award, X, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { ClockIcon } from "@heroicons/react/24/solid";

import { getInvestmentGoal, InvestmentGoalType } from "../../../../services/web3-api";
import { sendPixReceiptEmail, sendPurchaseEmail } from "../../../../services/email-service";
import { pixConfig, validatePixConfig, PixConfig, PixData } from "../../../../services/pix-config";
import { usePixGenerator, PixQRCodeDisplay } from "../components/PixQRCodeGenerator";
import { useProfile } from "../../../context/ProfileContext";

// Interface para resposta da API de email
interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Interface para erros
interface ErrorState {
  email?: string;
  validation?: string;
  api?: string;
  general?: string;
}

// Função de validação
const validateAmount = (amount: number): string | null => {
  if (!amount || amount <= 0) return "Valor deve ser maior que zero";
  if (amount > 100000) return "Valor não pode exceder 100.000 tokens";
  if (!Number.isInteger(amount)) return "Use apenas números inteiros";
  if (amount < 100) return "A compra mínima é de 100 tokens.";
  return null;
};

// Função para sanitizar dados
const sanitizeTemplateParams = (params: Record<string, any>): Record<string, any> => {
  const sanitized = { ...params };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // Remove HTML tags and trim whitespace, also replace multiple spaces with single space
      sanitized[key] = sanitized[key].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  });
  
  return sanitized;
};

// Componente de Loading
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
  <div className="flex items-center justify-center gap-2 py-4">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Componente de Erro
const ErrorMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
  <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
    <AlertCircle size={16} />
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-600 hover:text-red-800">
        <X size={16} />
      </button>
    )}
  </div>
);

// Componente de Sucesso
const SuccessMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
  <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
    <CheckCircle size={16} />
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-green-600 hover:text-green-800">
        <X size={16} />
      </button>
    )}
  </div>
);

// Componente de Opção de Token
const TokenOption: React.FC<{
  option: { value: number | string; label: string };
  onSelect: (value: number | string) => void;
  disabled?: boolean;
  isSelected?: boolean;
}> = React.memo(({ option, onSelect, disabled = false, isSelected = false }) => (
  <button
    className={`flex items-center justify-between transition-colors ${
      isSelected 
        ? 'bg-blue-600 border-blue-600 text-white button-circle-blue' 
        : 'bg-white button-circle-gray hover:border-gray-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={() => !disabled && onSelect(option.value)}
    disabled={disabled}
    data-testid={`token-option-${option.value}`}
  >
    <span className={`mr-4 px-6 text-lg font-medium ${
      isSelected ? 'text-white' : 'text-gray-500'
    }`}>
      {option.label}
    </span>
    <div className={`rounded-full p-2 ${
      isSelected ? 'bg-blue-500' : 'bg-gray-100'
    }`}>
      <ArrowRight size={20} className={isSelected ? 'text-white' : 'text-gray-400'} />
    </div>
  </button>
));

TokenOption.displayName = 'TokenOption';

export default function TokensToPurchasePage() {
  const t = useTranslations("TokensToPurchase");
  const common = useTranslations("Common");
  const { propertyId } = useProfile();

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Estados principais
  const [wallet, setWallet] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedTokenValue, setSelectedTokenValue] = useState<number | string | null>(null);
  const [infoGoal, setInfoGoal] = useState<InvestmentGoalType>();
  
  // Estados de UI
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isReceiptUploadOpen, setIsReceiptUploadOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);
  
  // Estados de erro e sucesso
  const [errors, setErrors] = useState<ErrorState>({});
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Hook para geração de PIX
  const pixGenerator = usePixGenerator();
  
  // Estados para upload de comprovante
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  
  // Estado para identificador PIX
  const [pixTransactionId, setPixTransactionId] = useState<string | null>(null);

  // Validar configuração PIX na inicialização
  const [pixConfigErrors, setPixConfigErrors] = useState<string[]>([]);
  
  useEffect(() => {
    const validation = validatePixConfig(pixConfig);
    if (!validation.isValid) {
      setPixConfigErrors(validation.errors);
      console.warn('Configuração PIX inválida:', validation.errors);
    }
  }, []);

  // Função para formatar valor em reais
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  // Debounce do valor customizado
  //const debouncedCustomAmount = useDebounce(customAmount, 500);

  // Array de opções de tokens para compra - memoizado
  const tokenOptions = useMemo(() => [
    { value: 100, label: "100" },
    { value: 500, label: "500" },
    { value: 1000, label: "1.000" },
    { value: "other", label: t("otherValue") }
  ], [t]);

  // Limpar erros após um tempo
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Validar valor customizado em tempo real
  useEffect(() => {
    if (customAmount > 0 && showCustomInput) {
      const validationError = validateAmount(customAmount);
      if (validationError) {
        setErrors(prev => ({ ...prev, validation: validationError }));
      } else {
        setErrors(prev => {
          const { validation, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [customAmount, showCustomInput]);

  // Fetch de dados quando wallet ou propertyId mudam
  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      setWallet(storedWallet);
    }

    const storedName = localStorage.getItem("name");
    if (storedName) {
      setUsername(storedName);
    }

    if (wallet && propertyId) { // Só buscar se wallet e propertyId existirem
      fetchPurchases();
    }
  }, [wallet, propertyId]);

  const fetchPurchases = useCallback(async () => {
    if (!wallet || !propertyId) {
      setMessage(common("pleaseLogin"));
      return;
    }

    setMessage(common("loading"));
    setErrors({});

    try {
      const data = await getInvestmentGoal(propertyId);

      if (data) {
        setInfoGoal(data);
      }

      setMessage(null);
    } catch (err) {
      console.error(t("errorLoadingPurchases"), err);
      setMessage(null);
      setErrors({ api: t("errorLoadingPurchases") });
    }
  }, [wallet, propertyId, common, t]);

  const handleBackNavigation = useCallback(() => {
    router.back();
  }, [router]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Função para seleção de tokens atualizada para usar o hook PIX
  const handleTokenSelection = useCallback(async (value: number | string) => {
    setSelectedTokenValue(value);
    
    if (value === "other") {
      setShowCustomInput(true);
      setSelectedAmount(null);
      pixGenerator.clearPixData();
      setPixTransactionId(null);
    } else {
      setSelectedAmount(value as number);
      try {
        const pixData = await pixGenerator.generatePixData(value as number);
        // Capturar o transaction ID do retorno da função
        setPixTransactionId(pixData.transactionId || null);
        setIsPopupOpen(true);
        setShowCustomInput(false);
      } catch (error) {
        console.error('Erro ao gerar dados do PIX:', error);
        setErrors({ general: 'Erro ao gerar QR Code PIX. Tente novamente.' });
      }
    }
    setErrors({});
  }, [pixGenerator]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = value === '' ? 0 : Number(value);
    setCustomAmount(numberValue);
  }, []);

  const sendTokenPurchaseEmail = useCallback(async (amount: number): Promise<boolean> => {
    setIsEmailLoading(true);
    setEmailMessage(null);
    setEmailSuccess(false);

    try {
      // Validação adicional antes de enviar
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      if (!amount || amount <= 0) {
        throw new Error('Quantidade inválida');
      }

      const result = await sendPurchaseEmail(amount, username, propertyId);
      
      if (result && result.success) {
        setEmailMessage('Solicitacao enviada para Firmeza Token');
        setEmailSuccess(true);
        return true;
      } else {
        const errorMsg = result?.error || result?.message || 'Falha ao enviar email - resposta inválida';
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar email';
      console.error('Erro detalhado no envio de email:', {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setEmailMessage(`Erro ao enviar email: ${errorMessage}`);
      setEmailSuccess(false);
      setErrors(prev => ({ ...prev, email: errorMessage }));
      return false;
    } finally {
      setIsEmailLoading(false);
    }
  }, [wallet, username, propertyId]);

  const handlePurchaseFlow = useCallback(async (amount: number) => {
    // Validar primeiro
    const validationError = validateAmount(amount);
    if (validationError) {
      setErrors({ validation: validationError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const emailSent = await sendTokenPurchaseEmail(amount);
      
      if (emailSent) {
        setSelectedAmount(amount);
        setIsPopupOpen(false);
        setIsSuccessPopupOpen(true);
        setShowCustomInput(false);        
      }
    } catch (error) {
      setErrors({ general: 'Erro ao processar compra. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  }, [sendTokenPurchaseEmail]);

  // Função para submeter valor customizado atualizada para usar o hook PIX
  const handleCustomAmountSubmit = useCallback(async () => {
    // Validar o valor antes de prosseguir
    const validationError = validateAmount(customAmount);
    if (validationError) {
      setErrors({ validation: validationError });
      return;
    }

    try {
      setSelectedAmount(customAmount);
      const pixData = await pixGenerator.generatePixData(customAmount);
      // Capturar o transaction ID do retorno da função
      setPixTransactionId(pixData.transactionId || null);
      setIsPopupOpen(true);
      setErrors({}); // Limpar erros quando bem-sucedido
    } catch (error) {
      console.error('Erro ao gerar dados do PIX:', error);
      setErrors({ general: 'Erro ao gerar QR Code PIX. Tente novamente.' });
    }
  }, [customAmount, pixGenerator]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedAmount) return;
    await handlePurchaseFlow(selectedAmount);
  }, [selectedAmount, handlePurchaseFlow]);

  const handleCancelPurchase = useCallback(() => {
    setIsPopupOpen(false);
    setSelectedAmount(null);
    setSelectedTokenValue(null);
    setPixTransactionId(null);
    pixGenerator.clearPixData();
    setErrors({});
  }, [pixGenerator]);

  const handleCloseSuccessPopup = useCallback(() => {
    setIsSuccessPopupOpen(false);
    setEmailMessage(null);
    setSelectedAmount(null);
    setSelectedTokenValue(null);
    setCustomAmount(0);
    setPixTransactionId(null);
    setErrors({});
  }, []);

  const handlePixCompleted = useCallback(() => {
    setIsPopupOpen(false);
    setIsReceiptUploadOpen(true);
  }, []);

  // Função para validar arquivo de comprovante
  const validateReceiptFile = useCallback((file: File): string | null => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return t('invalidFileType');
    }

    if (file.size > maxSize) {
      return t('fileTooBig');
    }

    return null;
  }, [t]);

  // Função para lidar com seleção de arquivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateReceiptFile(file);
      if (validationError) {
        setErrors({ general: validationError });
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setErrors({});
      }
    }
  }, [validateReceiptFile]);

  // Função para fazer upload do comprovante
  const uploadReceiptFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploadPinata', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      const result = await response.json();
      return result.url || result.ipfsUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error('Erro ao fazer upload do comprovante');
    }
  }, []);

  // Função para enviar comprovante por email
  const sendReceiptEmail = useCallback(async (receiptUrl?: string): Promise<void> => {
    if (!selectedAmount) {
      throw new Error('Valor da compra não encontrado');
    }

    const totalAmount = pixGenerator.calculateTotalAmount(selectedAmount);

    try {
      // console.log('Enviando email de comprovante PIX...', {
      //   tokenAmount: selectedAmount,
      //   totalAmount: totalAmount,
      //   username: username,
      //   propertyId: propertyId,
      //   receiptUrl: receiptUrl
      // });

      const result = await sendPixReceiptEmail({
        tokenAmount: selectedAmount,
        totalAmount: totalAmount,
        username: username,
        propertyId: propertyId,
        receiptUrl: receiptUrl,
        pixTransactionId: pixTransactionId || undefined
      });

      //console.log('Email enviado com sucesso:', result);
      setReceiptMessage(t('receiptSentSuccess'));
      setReceiptSuccess(true);
    } catch (error) {
      console.error('Erro detalhado ao enviar email:', error);
      
      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = t('receiptUploadError');
      if (error instanceof Error) {
        if (error.message.includes('template')) {
          errorMessage = 'Erro de configuração do sistema. Tente novamente.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }, [selectedAmount, pixGenerator, username, propertyId, t]);

  // Função para processar envio do comprovante
  const handleSendReceipt = useCallback(async () => {
    if (!selectedFile) {
      setErrors({ general: t('selectFileFirst') });
      return;
    }

    setIsReceiptUploading(true);
    setErrors({});
    setReceiptMessage(null);

    try {
      // Upload do arquivo
      const receiptUrl = await uploadReceiptFile(selectedFile);
      
      // Envio por email
      await sendReceiptEmail(receiptUrl);
      
      // Sucesso - fechar modal de upload e abrir modal de sucesso
      setTimeout(() => {
        setIsReceiptUploadOpen(false);
        setIsSuccessPopupOpen(true);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('receiptUploadError');
      setErrors({ general: errorMessage });
      setReceiptMessage(errorMessage);
      setReceiptSuccess(false);
    } finally {
      setIsReceiptUploading(false);
    }
  }, [selectedFile, uploadReceiptFile, sendReceiptEmail, t]);

  const handleCancelCustomInput = useCallback(() => {
    setShowCustomInput(false);
    setCustomAmount(0);
    setSelectedTokenValue(null);
    setErrors({});
  }, []);

  // Função para fechar modal de upload de comprovante
  const handleCloseReceiptUpload = useCallback(() => {
    setIsReceiptUploadOpen(false);
    setSelectedFile(null);
    setReceiptMessage(null);
    setReceiptSuccess(false);
    setErrors({});
  }, []);

  // Verificar se pode submeter valor customizado
  const canSubmitCustomAmount = useMemo(() => {
    return customAmount > 0 && !errors.validation && !isLoading && !isEmailLoading;
  }, [customAmount, errors.validation, isLoading, isEmailLoading]);

  // Loading state enquanto wallet não está carregado
  if (wallet === null) {
    return (
      <div className="mx-auto w-full max-w-[1360px] flex-1 px-4 flex justify-center items-center min-h-screen">
        <LoadingSpinner message="Carregando dados da carteira..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1360px] flex-1 px-4 flex justify-left">
      <main className="mt-4 mb-6">
        <div className="mx-auto bg-white px-4">
          <div>
            <button 
              onClick={handleBackNavigation} 
              className="text-gray-400 button-line-transparent border border-white text-sm hover:text-gray-600 transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft size={28} />
            </button>
          </div>

          <h2 className="text-lg font-medium text-gray-800 mb-6 mt-8">
            {t("chooseTokens")}
          </h2>

          {/* Exibir erros de configuração PIX */}
          {pixConfigErrors.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">⚠️ Configuração PIX Pendente</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {pixConfigErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2">
                    Configure seus dados reais em <code>src/services/pix-config.ts</code> ou use variáveis de ambiente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Exibir erros gerais */}
          {errors.general && (
            <div className="mb-4">
              <ErrorMessage message={errors.general} onDismiss={clearErrors} />
            </div>
          )}

          {errors.api && (
            <div className="mb-4">
              <ErrorMessage message={errors.api} onDismiss={clearErrors} />
            </div>
          )}

          {showCustomInput ? (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div >
                  <input
                    type="number"
                    placeholder={t("enterValue")}
                    className={`p-2 border rounded-lg w-full sm:w-32 ${
                      errors.validation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={customAmount || ""}
                    onChange={handleAmountChange}
                    min="100"
                    max="100000"
                    data-testid="custom-amount-input"
                  />
                  {errors.validation && (
                    <div className="mt-1">
                      <ErrorMessage message={errors.validation} />
                    </div>
                  )}
                </div>

                <div >
                  
                  <button
                    onClick={handleCustomAmountSubmit}
                    disabled={!canSubmitCustomAmount}
                    className="bg-blue-600 text-xs text-white font-bold px-6 sm:px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    data-testid="confirm-custom-amount"
                  >
                    {isLoading || isEmailLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      t("confirmPurchase")
                    )}
                  </button>
                  &nbsp;
                  <button
                    onClick={handleCancelCustomInput}
                    className="button-circle-gray-space text-xs text-white font-bold px-6 sm:px-8 py-3 rounded-full w-32 sm:w-40 h-10 hover:bg-gray-400 transition-colors"
                    data-testid="cancel-custom-amount"
                  >
                    {common("cancel")}
                  </button>
                </div>
              </div>

              {errors.email && (
                <div className="mt-4">
                  <ErrorMessage message={errors.email} onDismiss={clearErrors} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 sm:gap-20 mb-8">
              {tokenOptions.map((option) => (
                <TokenOption
                  key={option.value}
                  option={option}
                  onSelect={handleTokenSelection}
                  disabled={isLoading || isEmailLoading}
                  isSelected={selectedTokenValue === option.value}
                />
              ))}
            </div>
          )}

          {message && (
            <div className="mb-4">
              <LoadingSpinner message={message} />
            </div>
          )}

          {infoGoal && (
            <div className="bg-indigo-50 p-4 sm:p-6 mt-20 sm:mt-40 rounded-lg flex flex-col lg:flex-row items-center">
              <div className="w-full lg:w-1/4 mb-4 lg:mb-0">
                <h3 className="text-indigo-700 py-4 font-medium text-lg sm:text-xl gap-4 leading-tight text-center lg:text-left">
                  {t("trackProgress")}
                </h3>
              </div>

              <div className="w-full lg:w-1/2 px-0 lg:px-6 mb-4 lg:mb-0">
                <h2 className="text-indigo-700 font-bold text-xl sm:text-2xl mb-1 text-center lg:text-left">
                  {infoGoal.currentPercentageFormatted} {t("houseOwnership")}
                </h2>

                <div className="mt-3 mb-2 relative">
                  <div className="h-1 bg-gray-200 rounded-full w-full">
                    <div
                      className="h-1 bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${infoGoal.currentPercentage}%` }}
                    ></div>
                  </div>

                  <div
                    className="absolute -top-1.5 transition-all duration-300"
                    style={{ left: `calc(${infoGoal.currentPercentage}% - 6px)` }}
                  >
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 text-center lg:text-left">
                  <span>
                    {t("investMore")} {infoGoal.amountNeededCurrency} {t("andAchieve")}{" "}
                    <strong>{infoGoal.nextGoalPercentage}% {t("propertyOwnership")}</strong>
                  </span>
                </div>
              </div>

              <div className="w-full lg:w-1/4 flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="absolute px-4 top-0 transform z-10">
                      <img
                        src="/cadeado.png"
                        alt="Cadeado"
                        className="relative w-32 sm:w-40 h-14 sm:h-18"
                      />
                    </div>
                  </div>

                  <div className="absolute -top-2 -right-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute top-2 -right-4">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute -bottom-2 -left-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmação */}
      {isPopupOpen && selectedAmount !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full relative">
            <button
              onClick={handleCancelPurchase}
              className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-confirmation-popup"
            >
              <X size={20} />
            </button>
            
            {/* Header */}
            <div className="mb-8">
              
            </div>

            {/* Conteúdo principal - Layout em duas colunas */}
            <div className="flex gap-12">
              {/* Coluna esquerda - Resumo da compra */}
              <div className="flex-1 max-w-md px-10">
              <h1 className="text-3xl font-normal text-gray-700 mb-4 leading-tight">
                {t("purchaseRequested")} <span className="font-semibold">{selectedAmount} </span>
                {t("tokensOfThisProperty")}
              </h1>

              <p className="text-gray-600 text-lg mb-4">{t("checkDetailsAndPay")}</p>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-8">{t("purchaseSummary")}</h2>
                  
                  <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-base flex items-center gap-2">
                        {t("tokenPurchase")}
                        <div className="relative group inline-block text-left">
                          <div className="info-icon" />
                          <div className="absolute z-50 hidden group-hover:block bg-white text-black text-xs rounded py-2 px-3 top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-normal shadow-lg border w-64 normal-case">
                          {t('tokenPurchaseInfo')}
                          </div>
                      </div>
                      </span>
                      <span className="font-normal text-gray-900 text-base">{formatCurrency(selectedAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-base flex items-center gap-2">
                        {t("tokenPurchaseFee")}
                        <div className="relative group inline-block text-left">
                          <div className="info-icon" />
                          <div className="absolute z-50 hidden group-hover:block bg-white text-black text-xs rounded py-2 px-3 top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-normal shadow-lg border w-64 normal-case">
                          {t('tokenPurchaseFeeInfo')}
                          </div>
                      </div>
                      </span>
                      <span className="font-normal text-gray-900 text-base">{formatCurrency(selectedAmount * 0.075)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-200 p-6 rounded-xl">
                    <p className="text-gray-700 text-base mb-3">{t("totalToPay")}</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {formatCurrency(pixGenerator.calculateTotalAmount(selectedAmount))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coluna direita - QR Code + PIX + Botões */}
              <div className="w-90 flex flex-col">
                {pixGenerator.pixData && (
                  <PixQRCodeDisplay
                    pixData={pixGenerator.pixData}
                    qrCodeDataUrl={pixGenerator.qrCodeDataUrl}
                    amount={selectedAmount}
                    totalAmount={pixGenerator.calculateTotalAmount(selectedAmount)}
                    formatCurrency={formatCurrency}
                  />
                )}

                <p className="text-gray-600 text-base mb-8 text-center">
                  {t("nowJustCompletePix")}
                </p>

                {/* Botões */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCancelPurchase}
                    className="flex-1 px-6 py-4 border  bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-base font-medium"
                  >
                    {common("cancel")}
                  </button>
                  <button
                    onClick={handlePixCompleted}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium text-base"
                  >
                    {t("pixCompleted")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload de Comprovante */}
      {isReceiptUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={handleCloseReceiptUpload}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('uploadReceiptTitle')}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {t('uploadReceiptMessage')}
              </p>
            </div>

            {/* Upload de arquivo */}
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="receipt-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-blue-600 font-medium hover:text-blue-700">
                    {t('selectReceiptFile')}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('supportedFormats')}
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* Mensagens de erro/sucesso */}
            {errors.general && (
              <div className="mb-4">
                <ErrorMessage message={errors.general} onDismiss={() => setErrors({})} />
              </div>
            )}

            {receiptMessage && (
              <div className="mb-4">
                {receiptSuccess ? (
                  <SuccessMessage message={receiptMessage} />
                ) : (
                  <ErrorMessage message={receiptMessage} />
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <button
                onClick={handleCloseReceiptUpload}
                className="flex-1 px-4 py-3 borderbg-blue-600 text-sm text-white rounded-full hover:bg-blue-700 transition-colors"
                disabled={isReceiptUploading}
              >
                {common("cancel")}
              </button>
              
              <button
                onClick={handleSendReceipt}
                disabled={!selectedFile || isReceiptUploading}
                className="flex-1 px-4 py-3 bg-blue-600 text-sm text-white rounded-full hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReceiptUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('uploadingReceipt')}
                  </div>
                ) : (
                  t('sendReceipt')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Processamento */}
      {isSuccessPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={handleCloseSuccessPopup}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-success-popup"
            >
              <X size={20} />
            </button>
            
            <div className="text-center py-6">
              {/* Círculo estático com ícone de relógio */}
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="relative">
                  {/* Ícone de relógio no centro */}
                  <div className="w-16 h-16 flex items-center justify-center">
                    <ClockIcon className="w-12 h-12 text-blue-600 z-10" />
                  </div>
                  {/* Círculo azul estático */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full"></div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-blue-600 mb-4">
                {t("processingPayment")}
              </h2>
              
              <p className="text-gray-600 text-sm mb-6">
                {t("tokensWillAppear")}
              </p>
              
              {emailMessage && (
                <div className="mt-4">
                  {emailSuccess ? (
                    <SuccessMessage message={emailMessage} />
                  ) : (
                    <ErrorMessage message={emailMessage} />
                  )}
                </div>
              )}
              
              {isEmailLoading && (
                <div className="mt-4">
                  <LoadingSpinner message="Enviando notificação..." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}