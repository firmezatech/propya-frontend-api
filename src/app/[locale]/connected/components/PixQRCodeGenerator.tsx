import React, { useState, useCallback, useEffect } from "react";
import { Copy, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { pixConfig, PixData } from "../../../../services/pix-config";
import { useTranslations } from 'next-intl';

interface PixQRCodeGeneratorProps {
  amount: number;
  onPixDataGenerated?: (pixData: PixData) => void;
  onError?: (error: string) => void;
}

interface PixQRCodeDisplayProps {
  pixData: PixData;
  qrCodeDataUrl: string | null;
  amount: number;
  totalAmount: number;
  formatCurrency: (value: number) => string;
  className?: string;
}

// Hook personalizado para geração de PIX
export const usePixGenerator = () => {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Função para calcular CRC16 (necessário para chave PIX)
  const calculateCRC16 = useCallback((data: string): string => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }, []);

  // Função para calcular valor total com taxa de 7,5%
  const calculateTotalAmount = useCallback((baseAmount: number): number => {
    return baseAmount * 1.075;
  }, []);

  // Função para gerar chave PIX real baseada nos dados bancários configurados
  const generatePixKey = useCallback((amount: number): { pixKey: string; transactionId: string } => {
    const totalAmount = calculateTotalAmount(amount);
    const formattedAmount = totalAmount.toFixed(2);
    
    // Gerar ID único da transação
    const transactionId = `FMZ${Date.now().toString().slice(-8)}`;
    
    // Construir payload PIX conforme padrão EMV
    let payload = "";
    
    // Payload Format Indicator
    payload += "000201";
    
    // Point of Initiation Method (opcional para QR estático)
    payload += "010212";
    
    // Merchant Account Information
    const pixKeyLength = pixConfig.pixKey.length.toString().padStart(2, '0');
    const merchantInfo = `0014BR.GOV.BCB.PIX01${pixKeyLength}${pixConfig.pixKey}`;
    const merchantInfoLength = merchantInfo.length.toString().padStart(2, '0');
    payload += `26${merchantInfoLength}${merchantInfo}`;
    
    // Merchant Category Code
    payload += `5204${pixConfig.merchantCategoryCode}`;
    
    // Transaction Currency (986 = BRL)
    payload += "5303986";
    
    // Transaction Amount
    const amountLength = formattedAmount.length.toString().padStart(2, '0');
    payload += `54${amountLength}${formattedAmount}`;
    
    // Country Code
    payload += "5802BR";
    
    // Merchant Name
    const merchantNameLength = pixConfig.merchantName.length.toString().padStart(2, '0');
    payload += `59${merchantNameLength}${pixConfig.merchantName}`;
    
    // Merchant City
    const merchantCityLength = pixConfig.merchantCity.length.toString().padStart(2, '0');
    payload += `60${merchantCityLength}${pixConfig.merchantCity}`;
    
    // Additional Data Field (Transaction ID)
    const additionalData = `05${transactionId.length.toString().padStart(2, '0')}${transactionId}`;
    const additionalDataLength = additionalData.length.toString().padStart(2, '0');
    payload += `62${additionalDataLength}${additionalData}`;
    
    // CRC16 placeholder
    payload += "6304";
    
    // Calcular CRC16 e adicionar ao final
    const crc = calculateCRC16(payload);
    payload += crc;
    
    return { pixKey: payload, transactionId };
  }, [calculateTotalAmount, calculateCRC16]);

  // Função para gerar QR Code dinamicamente
  const generateQRCode = useCallback(async (pixKey: string): Promise<string> => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(pixKey, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw new Error('Falha ao gerar QR Code');
    }
  }, []);

  // Função para gerar dados PIX dinamicos
  const generatePixData = useCallback(async (amount: number): Promise<PixData> => {
    setIsGenerating(true);
    try {
      const totalAmount = calculateTotalAmount(amount);
      const { pixKey, transactionId: txId } = generatePixKey(amount);
      const qrCodeUrl = await generateQRCode(pixKey);
      
      // Armazena os dados gerados
      setQrCodeDataUrl(qrCodeUrl);
      setTransactionId(txId);
      
          const pixData: PixData = {
      amount: totalAmount,
      copyPasteKey: pixKey,
      qrCode: qrCodeUrl,
      transactionId: txId
    };

    setPixData(pixData);
    return pixData;
    } finally {
      setIsGenerating(false);
    }
  }, [calculateTotalAmount, generatePixKey, generateQRCode]);

  // Função para copiar o código PIX
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
    }
  }, []);

  // Função para limpar dados
  const clearPixData = useCallback(() => {
    setPixData(null);
    setQrCodeDataUrl(null);
    setIsCopied(false);
    setTransactionId(null);
  }, []);

  return {
    pixData,
    qrCodeDataUrl,
    isCopied,
    isGenerating,
    transactionId,
    generatePixData,
    copyToClipboard,
    clearPixData,
    calculateTotalAmount
  };
};

// Componente para exibir QR Code PIX
export const PixQRCodeDisplay: React.FC<PixQRCodeDisplayProps> = ({
  pixData,
  qrCodeDataUrl,
  amount,
  totalAmount,
  formatCurrency,
  className = ""
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslations('TokensToPurchase');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
    }
  };

  if (!pixData) return null;

  return (
    <div className={className}>
      {/* QR Code */}
      <div className="text-center mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm inline-block">
          {qrCodeDataUrl ? (
            <Image
              src={qrCodeDataUrl}
              alt="QR Code PIX"
              width={160}
              height={160}
              className="mx-auto"
            />
          ) : (
            <div className="w-[160px] h-[160px] bg-gray-100 flex items-center justify-center mx-auto">
              <span className="text-gray-400 text-sm">{t('loading')}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="font-bold text-base text-gray-800">{formatCurrency(totalAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">{t('scanQRCode')}</p>
        </div>
      </div>

      {/* Chave PIX para copiar */}
      <div className="mb-6">
        <p className="text-base text-gray-600 mb-3 text-center">{t('orCopyPIXKey')}</p>
        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border">
          <input
            type="text"
            value={pixData.copyPasteKey}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />
          <button
            onClick={() => copyToClipboard(pixData.copyPasteKey)}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title={isCopied ? t('pixCopied') : t('orCopyPIXKey')}
          >
            {isCopied ? (
              <CheckCircle size={16} className="text-white" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal para geração de PIX
const PixQRCodeGenerator: React.FC<PixQRCodeGeneratorProps> = ({
  amount,
  onPixDataGenerated,
  onError
}) => {
  const {
    pixData,
    qrCodeDataUrl,
    isGenerating,
    generatePixData
  } = usePixGenerator();
  const t = useTranslations('TokensToPurchase');

  // Gerar PIX data quando o amount mudar
  useEffect(() => {
    if (amount > 0) {
      generatePixData(amount)
        .then((data) => {
          onPixDataGenerated?.(data);
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar PIX';
          onError?.(errorMessage);
        });
    }
  }, [amount, generatePixData, onPixDataGenerated, onError]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t('loadingPurchases')}</span>
      </div>
    );
  }

  return null; // Este componente é apenas lógico, a exibição é feita pelo PixQRCodeDisplay
};

export default PixQRCodeGenerator; 