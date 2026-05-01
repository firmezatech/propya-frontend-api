"use client";

import React, { useState, useEffect, useMemo } from "react";
import InvoiceBaseAdmin from "../components/invoice/InvoiceBaseAdmin";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Check } from "lucide-react";
import { login } from "../../../../services/loginweb3";
import { useWallet } from '../../../../hooks/useWallet';
import { useInvoices } from '../../../../hooks/useInvoices';
import { registerLocale } from 'react-datepicker';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import CustomDatePicker from "../../components/ui/DatePicker";
import {formatDate, convertToNumber, formatCurrencyInput} from "services/format";

// Registra o locale português
registerLocale('pt-BR', ptBR);

export default function InvoicesAdminPage() {
  const router = useRouter();
  const t = useTranslations('InvoiceAdmin');
  const { wallet } = useWallet();
  
  const { 
    invoices,
    isCreating,
    fetchInvoices,
    handleCreateInvoice,
    toggleInvoiceDetails,
    setContextMessage
  } = useInvoices();
  const [message, setMessage] = useState<string | null>(null);
  const [showAutoInvoiceFields, setShowAutoInvoiceFields] = useState(false);
  const [showRentFields, setShowRentFields] = useState(false);
  const [showTokenFields, setShowTokenFields] = useState(false);

  // Debug logs para os states
  useEffect(() => {
    console.log("State - showAutoInvoiceFields:", showAutoInvoiceFields);
  }, [showAutoInvoiceFields]);

  useEffect(() => {
    console.log("State - showRentFields:", showRentFields);
  }, [showRentFields]);

  useEffect(() => {
    console.log("State - showTokenFields:", showTokenFields);
  }, [showTokenFields]);

  const [rentAmount, setRentAmount] = useState<string>("");
  const [rentCondominium, setRentCondominium] = useState<string>("");
  const [propertyTax, setPropertyTax] = useState<string>("");
  const [tokenQuantity, setTokenQuantity] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingInvoiceType, setPendingInvoiceType] = useState<number | null>(null);
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  // New state for properties and selected property
  const [properties, setProperties] = React.useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>("");
  const [propertiesLoaded, setPropertiesLoaded] = React.useState<boolean>(false);

  interface Property {
    id: string | number;
    value: string;
  }

  // Função para lidar com mudanças nos campos de moeda
  const handleCurrencyChange = (value: string, setter: (value: string) => void) => {
    const formatted = formatCurrencyInput(value);
    setter(formatted);
  };

  // Modificar a função loadPropertiesIfNeeded para ser mais robusta
  const loadPropertiesIfNeeded = React.useCallback(async () => {
    try {
      //console.log("🔍 Loading properties...");
      const { getProperties } = await import('../../../../services/web3-api');
      const properties = await getProperties();
      
      //console.log("🔍 Properties from API:", properties);
      
      if (Array.isArray(properties) && properties.length > 0) {
        setProperties(properties);
        setSelectedPropertyId(properties[0].id.toString());
        setPropertiesLoaded(true);
        setMessage(null); // Limpa qualquer mensagem de erro anterior
       // console.log("✅ Properties loaded successfully:", properties.length, "properties");
      } else {
        console.warn("⚠️ No properties found in response");
        setMessage(t('noPropertiesAvailable'));
        setProperties([]);
        setPropertiesLoaded(true);
      }
    } catch (error) {
      console.error("❌ Failed to fetch properties:", error);
      setMessage(t('errorLoadingProperties'));
      setProperties([]);
      setPropertiesLoaded(true);
    }
  }, [t]);

  // Carregar propriedades quando o componente montar e quando a carteira estiver conectada
  useEffect(() => {
    if (wallet) {
      loadPropertiesIfNeeded();
    }
  }, [wallet, loadPropertiesIfNeeded]);

  // Carregar propriedades quando qualquer formulário for aberto
  useEffect(() => {
    if (wallet && (showAutoInvoiceFields || showRentFields || showTokenFields)) {
      loadPropertiesIfNeeded();
    }
  }, [wallet, showAutoInvoiceFields, showRentFields, showTokenFields, loadPropertiesIfNeeded]);

  // Modificar o renderPropertySelection para mostrar estado de carregamento
  const renderPropertySelection = () => {
    if (!propertiesLoaded) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('propertySelectLabel')}
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
            {t('propertySelectLabel')}
          </label>
          <div className="text-sm text-red-500">
            {t('noPropertiesAvailable')}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">
          {t('propertySelectLabel')}
        </label>
        <select
          id="propertySelect"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {properties.map((property: Property) => (
            <option key={property.id} value={property.id}>
              {property.value}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Function to toggle between showing all invoices and only non-paid/non-cancelled
  const toggleShowAllInvoices = () => {
    setShowAllInvoices(!showAllInvoices);
  };

  // Create a memoized filter function that updates when dependencies change
  const memoizedFilterFunction = useMemo(() => {
    return (invoices: any[]) => {
      
      if (showAllInvoices) {
        return invoices;
      } else {
        const filtered = invoices.filter(inv => inv.status !== 3 && inv.status !== 1);
        return filtered;
      }
    };
  }, [showAllInvoices]);

  // Limpa a mensagem de erro quando a carteira é conectada
  useEffect(() => {
    if (wallet && message === t('walletRequired')) {
      setMessage(null);
    }
  }, [wallet, message, t]);

  // Validate property selection before creating invoice
  const validatePropertySelection = (): boolean => {
    if (!selectedPropertyId) {
      setMessage(t('propertySelectionRequired') || "Please select a property");
      return false;
    }
    return true;
  };

  const handleCreateTokenPurchase = async () => {
    try {
      const additionalValues = {
        propertyId: selectedPropertyId,
        dueDate: selectedDate ? formatDate(selectedDate) : "0",
        tokenQuantity: Number(tokenQuantity),
        rentAmount: undefined,
        rentCondominium: undefined,
        propertyTax: undefined
      };

      await handleCreateInvoice(2, additionalValues);
      
      // Clear fields after successful creation
      setTokenQuantity("");
      setSelectedDate(null);
      setDateError("");
      setShowTokenFields(false);
      
      // Recarrega a lista de boletos
      await fetchInvoices();
      //console.log("✅ Lista de boletos atualizada após criar boleto de tokens");
    } catch (error) {
      setContextMessage(t('invoiceCreateError') + (error instanceof Error ? error.message : ''));
    }
  };

  const handleCreateAutoInvoice = async () => {
    try {
      await handleCreateInvoice(0, { 
        propertyId: selectedPropertyId,
        dueDate: "0"
      });
      
      // Clear fields and refresh list
      setSelectedDate(null);
      setShowAutoInvoiceFields(false);
      
      // Recarrega a lista de boletos
      await fetchInvoices();
      //console.log("✅ Lista de boletos atualizada após criar boleto automático");
    } catch (error) {
      setContextMessage(t('invoiceCreateError') + (error instanceof Error ? error.message : ''));
    }
  };

  const handleCreateInvoiceClick = async (type: number) => {
    if (!validatePropertySelection()) {
      return;
    }

    // For type 1 (manual invoice), validate and create directly
    if (type === 1) {
      const rentAmountValue = convertToNumber(rentAmount);
      const rentCondominiumValue = convertToNumber(rentCondominium);
      const propertyTaxValue = convertToNumber(propertyTax);

      if (rentAmountValue === "0" || rentCondominiumValue === "0") {
        setMessage(t('rentValuesRequired'));
        return;
      }

      // Validate token quantity for manual invoice
      if (tokenQuantity && Number(tokenQuantity) < 0) {
        setMessage(t('tokenQuantityRequired'));
        return;
      }

      // Create manual invoice directly without confirmation
      const additionalValues = {
        propertyId: selectedPropertyId,
        dueDate: selectedDate ? formatDate(selectedDate) : undefined,
        rentAmount: rentAmountValue,
        rentCondominium: rentCondominiumValue,
        propertyTax: propertyTaxValue,
        tokenQuantity: Number(tokenQuantity)
      };

      try {
        await handleCreateInvoice(type, additionalValues);
        
        // Limpa os campos após criar com sucesso
        setRentAmount("");
        setRentCondominium("");
        setPropertyTax(""),
        setTokenQuantity("");
        setSelectedDate(null);
        setDateError("");
        setShowRentFields(false);
        
        // Recarrega a lista de boletos
        await fetchInvoices();
       // console.log("✅ Lista de boletos atualizada após criar boleto manual");
      } catch (error) {
        setContextMessage(t('invoiceCreateError') + (error instanceof Error ? error.message : ''));
      }

      return;
    }

    // For type 2 (token purchase), validate token quantity
    if (type === 2) {
      if (!tokenQuantity || Number(tokenQuantity) <= 0) {
        setMessage(t('tokenQuantityRequired'));
        return;
      }
    }

    // Show confirmation dialog only for types 0 and 2
    setPendingInvoiceType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirmCreateInvoice = async () => {
    if (pendingInvoiceType === null) {
      return;
    }

    if (!validatePropertySelection()) {
      return;
    }

    try {
      // Prepare additional values based on invoice type
      const additionalValues: any = {
        propertyId: selectedPropertyId,
        dueDate: selectedDate ? formatDate(selectedDate) : undefined,
      };

      if (pendingInvoiceType === 1 || showRentFields) {
        additionalValues.rentAmount = showRentFields ? convertToNumber(rentAmount) : undefined;
        additionalValues.rentCondominium = showRentFields ? convertToNumber(rentCondominium) : undefined;
        additionalValues.propertyTax = showRentFields ? convertToNumber(propertyTax) : undefined;
      }
      
      if (pendingInvoiceType === 1 || pendingInvoiceType === 2) {
        additionalValues.tokenQuantity = Number(tokenQuantity);
      }

      await handleCreateInvoice(pendingInvoiceType, additionalValues);
      
      // Limpa os campos após criar com sucesso
      setRentAmount("");
      setRentCondominium("");
      setPropertyTax("");
      setTokenQuantity("");
      setSelectedDate(null);
      setDateError("");
      setShowRentFields(false);
      setShowTokenFields(false);
      setShowAutoInvoiceFields(false);
      setShowConfirmDialog(false);
      setPendingInvoiceType(null);
      
      // Recarrega a lista de boletos
      await fetchInvoices();
     // console.log("✅ Lista de boletos atualizada após confirmar criação do boleto");
    } catch (error) {
      setContextMessage(t('invoiceCreateError') + (error instanceof Error ? error.message : ''));
    }
  };

  const handleCancelCreate = () => {
    setShowConfirmDialog(false);
    setPendingInvoiceType(null);
  };

  const CreateInvoiceDialog = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => {
    if (!showConfirmDialog || pendingInvoiceType === null || pendingInvoiceType === 1) return null;

    const handleConfirmClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onConfirm();
    };

    const handleCancelClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    // Função para obter o título e mensagem corretos baseado no tipo de boleto
    const getDialogContent = () => {
      switch (pendingInvoiceType) {
        case 0:
          return {
            title: t("confirmCreateAutoInvoiceTitle"),
            message: t("confirmCreateAutoInvoiceMessage")
          };
        case 2:
          return {
            title: t("confirmCreateTokenPurchaseTitle"),
            message: t("confirmCreateTokenPurchaseMessage", {
              date: selectedDate ? formatDate(selectedDate) : '',
              tokenQuantity: tokenQuantity
            })
          };
        default:
          return {
            title: t("confirmCreateInvoiceTitle"),
            message: t("confirmCreateInvoiceMessage")
          };
      }
    };

    const dialogContent = getDialogContent();

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-lg font-semibold mb-4">
            {dialogContent.title}
          </div>
          <div className="mb-6 text-gray-600">
            {dialogContent.message}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X size={16} className="mr-1" />
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isCreating}
              className={`bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg flex items-center ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("creating")}
                </>
              ) : (
                <>
                  <Check size={16} className="mr-1" />
                  {t("confirm")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleToggleAutoInvoiceFields = () => {
   // console.log("🔥 BOTÃO CLICADO - Auto Invoice Fields");
   // console.log("Estado atual:", { showAutoInvoiceFields, showRentFields, showTokenFields });
    setShowAutoInvoiceFields(!showAutoInvoiceFields);
    // Fecha os outros formulários
    if (!showAutoInvoiceFields) {
      setShowRentFields(false);
      setShowTokenFields(false);
    }
   // console.log("🔥 Estado após mudança:", { showAutoInvoiceFields: !showAutoInvoiceFields });
    // Carrega propriedades em background
    loadPropertiesIfNeeded().catch(console.error);
  };

  const handleToggleRentFields = () => {
   // console.log("🔥 BOTÃO CLICADO - Rent Fields");
    //console.log("Estado atual:", { showAutoInvoiceFields, showRentFields, showTokenFields });
    setShowRentFields(!showRentFields);
    // Fecha os outros formulários
    if (!showRentFields) {
      setShowAutoInvoiceFields(false);
      setShowTokenFields(false);
    }
   // console.log("🔥 Estado após mudança:", { showRentFields: !showRentFields });
    // Carrega propriedades em background
    loadPropertiesIfNeeded().catch(console.error);
  };

  const handleToggleTokenFields = () => {
   // console.log("🔥 BOTÃO CLICADO - Token Fields");
    //console.log("Estado atual:", { showAutoInvoiceFields, showRentFields, showTokenFields });
    setShowTokenFields(!showTokenFields);
    // Fecha os outros formulários
    if (!showTokenFields) {
      setShowAutoInvoiceFields(false);
      setShowRentFields(false);
    }
   // console.log("🔥 Estado após mudança:", { showTokenFields: !showTokenFields });
    // Carrega propriedades em background
    loadPropertiesIfNeeded().catch(console.error);
  };

   return (
    <InvoiceBaseAdmin 
      key={`${showAllInvoices ? 'all' : 'filtered'}`}
      isAdminView={true}
      filterInvoices={memoizedFilterFunction}
    >
      {(context: any) => {
        const { fetchInvoices, setMessage: setContextMessage, toggleInvoiceDetails, invoices, wallet } = context;

        // Se não houver carteira conectada, mostrar mensagem e botão de conexão
        if (!wallet) {
          return (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="text-lg font-semibold mb-4 text-gray-700">
                {t('walletNotConnected')}
              </div>
              <button
                onClick={async () => {
                  try {
                    const account = await login();
                    if (account) {
                      localStorage.setItem('wallet', account);
                      // Disparar evento para atualizar o estado da carteira
                      window.dispatchEvent(new Event('walletChanged'));
                    }
                  } catch (error) {
                    setContextMessage(t('walletConnectionError'));
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center"
              >
                <span className="text-sm">{t('connectWallet')}</span>
              </button>
            </div>
          );
        }

        // Mostrar mensagem de erro/sucesso se houver
        const renderMessage = () => {
          if (!message) return null;
          
          const isSuccess = message.includes('sucesso');
          return (
            <div className={`mb-6 rounded-md p-4 text-sm ${
              isSuccess 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
            }`}>
              {message}
            </div>
          );
        };

        return (
          <div className="flex flex-col">
            {renderMessage()}

            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => router.back()} className="border rounded button-line">
                {t('backButton')}
              </button>

            {/* Botão Novo Boleto (type 0) */}
            <button
              onClick={handleToggleAutoInvoiceFields}
              disabled={isCreating}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="text-sm">{t('newInvoiceButton')}</span>
            </button>

            {/* Botão Novo Boleto Avulso (type 1) */}
            <button
              onClick={handleToggleRentFields}
              disabled={isCreating}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="text-sm">{t('newInvoiceButtonSingle')}</span>
            </button>

            {/* Botão Compra de Tokens (type 2) */}
            <button
              onClick={handleToggleTokenFields}
              disabled={isCreating}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="text-sm">{t('newInvoiceButtonPurchaseTokens')}</span>
            </button>

              {/* Botão Mostrar Todos */}
              <button
                onClick={toggleShowAllInvoices}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {showAllInvoices ? 'Mostrar Apenas Pendentes' : 'Mostrar Todos'}
              </button>


            </div>

            {/* Diálogo de Confirmação */}
            {showConfirmDialog && (
              <CreateInvoiceDialog
                onConfirm={() => {
                  handleConfirmCreateInvoice();
                }}
                onCancel={() => {
                  handleCancelCreate();
                }}
              />
            )}

            {/* Property selection for all invoice types */}
            {(showAutoInvoiceFields || showRentFields || showTokenFields) && renderPropertySelection()}

           <div className="grid gap-4">
              {/* Campos do Boleto Automático */}
              {showAutoInvoiceFields && (
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 mb-2">
                      {t('automaticInvoiceDescription')}
                    </div>
                    <button
                      onClick={handleCreateAutoInvoice}
                      disabled={isCreating}
                      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center ${
                        isCreating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isCreating ? (
                        <span className="text-sm flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('creating')}
                        </span>
                      ) : (
                        <span className="text-sm">{t('createAutomaticInvoice')}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Campos do Boleto Avulso */}
              {showRentFields && (
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-100">
                      <CustomDatePicker
                        selectedDate={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        label={t('dueDate')}
                        placeholder={t('dueDatePlaceholder')}
                        error={dateError}
                        required
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('rentAmount')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                          type="text"
                          value={rentAmount}
                          onChange={(e) => handleCurrencyChange(e.target.value, setRentAmount)}
                          className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                          placeholder="0,00"
                      />
                      </div>
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('rentCondominium')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                          type="text"
                          value={rentCondominium}
                          onChange={(e) => handleCurrencyChange(e.target.value, setRentCondominium)}
                          className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                          placeholder="0,00"
                      />
                      </div>
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('propertyTax')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                          type="text"
                          value={propertyTax}
                          onChange={(e) => handleCurrencyChange(e.target.value, setPropertyTax)}
                          className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                          placeholder="0,00"
                      />
                      </div>
                      </div>
                      
                      <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('tokenQuantity')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tokenQuantity}
                          onChange={(e) => setTokenQuantity(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-none">
                    <button
                        onClick={() => handleCreateInvoiceClick(1)}
                        disabled={isCreating}
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center h-[42px] ${
                          isCreating ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isCreating ? (
                          <span className="text-sm flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t('creating')}
                          </span>
                        ) : (
                          <span className="text-sm">{t('createManualInvoice')}</span>
                        )}
                    </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos da Compra de Tokens */}
              {showTokenFields && (
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-60">
                      <CustomDatePicker
                        selectedDate={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        label={t('dueDate')}
                        placeholder={t('dueDatePlaceholder')}
                        error={dateError}
                        required
                      />
                  </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                        {t('tokenQuantity')}
                      </label>
                    <input
                      type="number"
                      value={tokenQuantity}
                      onChange={(e) => setTokenQuantity(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                    />
                  </div>
                    <div className="flex-none">
                  <button
                        onClick={handleCreateTokenPurchase}
                        disabled={isCreating}
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center h-[42px] ${
                          isCreating ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isCreating ? (
                          <span className="text-sm flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t('creating')}
                          </span>
                        ) : (
                          <span className="text-sm">{t('createTokenPurchase')}</span>
                        )}
                  </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </InvoiceBaseAdmin>
  );
}
