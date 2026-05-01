import { useState, useCallback } from 'react';
import { createInvoice } from '../services/web3-api';
import { APICache } from '../services/web3-api';  // Add this import

interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
  transactionHash?: string;
}

interface AdditionalValues {
  propertyId?: string;
  rentAmount?: string | number | null;
  rentCondominium?: string | number | null;
  tokenQuantity?: string | number;
  dueDate?: string;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    // Implemente a lógica para buscar os boletos
    // Por enquanto, vamos apenas simular
    console.log('Fetching invoices...');
  }, []);

  const toggleInvoiceDetails = useCallback((invoiceId: number) => {
    // Implemente a lógica para mostrar/esconder detalhes do boleto
    console.log('Toggling invoice details for ID:', invoiceId);
  }, []);

  const handleCreateInvoice = async (
    type: number,
    additionalValues?: {
      propertyId?: string;
      dueDate?: string;
      rentAmount?: string;
      rentCondominium?: string;
      propertyTax?: string;
      tokenQuantity?: number;
    }
  ) => {
    try {
      setIsCreating(true);
      
      let result: CreateInvoiceResponse;
      
      // Valores padrão
      const propertyId = additionalValues?.propertyId || "1";
      const dueDate = additionalValues?.dueDate || "0";
      
      // Converter quantidade de tokens (usado em ambos os tipos 1 e 2)
      const tokenQty = additionalValues?.tokenQuantity ? Number(additionalValues.tokenQuantity) : 0;
      
      if (type === 0) {
        // Boleto Automático
        result = await createInvoice(propertyId, 0, dueDate, "0", "0", "0", 0);
      } else if (type === 1) {
        // Boleto Avulso
        if (!additionalValues?.rentAmount || !additionalValues?.rentCondominium) {
          throw new Error('Rent amount and condominium values are required for manual invoice');
        }
        if (!additionalValues?.propertyTax) {
          additionalValues.propertyTax = "0";
        }
        result = await createInvoice(
          propertyId,
          1,
          dueDate,
          additionalValues.rentAmount as string,
          additionalValues.rentCondominium as string,
          additionalValues.propertyTax as string,
          tokenQty // Agora enviando a quantidade de tokens também para boleto avulso
        );
      } else if (type === 2) {
        // Compra de Tokens
        if (additionalValues?.tokenQuantity === undefined) {
          throw new Error('Token quantity is required for token purchase');
        }
        if (isNaN(tokenQty) || tokenQty <= 0) {
          throw new Error('Invalid token quantity');
        }
        result = await createInvoice(
          propertyId, 
          2, 
          dueDate, 
          additionalValues.rentAmount as string, 
          additionalValues.rentCondominium as string, 
          additionalValues.propertyTax as string, 
          tokenQty
        );
      } else {
        throw new Error('Invalid invoice type');
      }

      // Se chegou aqui, significa que a chamada foi bem sucedida
      // Não precisamos verificar result.success porque a API já lança erro se não for sucesso
      setContextMessage('Invoice created successfully!');
      
      // Invalidate cache before fetching
      APICache.invalidate('getInvoice');
      APICache.invalidate('getMaintenanceList');
      
      await fetchInvoices();
      if (result.invoiceId) {
        toggleInvoiceDetails(parseInt(result.invoiceId, 10));
      }
      return result; // Retorna o resultado para que o componente saiba que foi sucesso
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    invoices,
    isCreating,
    fetchInvoices,
    handleCreateInvoice,
    toggleInvoiceDetails,
    setContextMessage
  };
} 