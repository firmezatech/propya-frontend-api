import emailjs from '@emailjs/browser';

// Interface para resposta da API de email
export interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Tipo para os templates disponíveis
export type EmailTemplate = 'templateToken' | 'templateInvoice' | 'templatePixReceipt';

// Interfaces para os parâmetros de cada template
export interface TokenEmailParams {
  token_amount: string;
  username: string | null;
  property_id: string;
  purchase_date: string;
  purchase_time: string;
  subject: string;
}

export interface InvoiceEmailParams {
  invoice_number: string;
  amount: string;
  due_date: string;
  property_id: string;
  issue_date: string;
  issue_time: string;
  subject: string;
  boleto_url?: string;
}

export interface PixReceiptEmailParams {
  token_amount: string;
  total_amount: string;
  username: string | null;
  property_id: string;
  purchase_date: string;
  purchase_time: string;
  receipt_url?: string;
  pix_transaction_id?: string;
  subject: string;
}

// Tipo união para os parâmetros
type EmailTemplateParams = TokenEmailParams | InvoiceEmailParams | PixReceiptEmailParams;

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

// Função para obter o ID do template baseado no tipo
const getTemplateId = (template: EmailTemplate): string => {
  switch (template) {
    case 'templateToken':
      return process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TOKEN || '';
    case 'templateInvoice':
      return process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_INVOICE || '';
    case 'templatePixReceipt':
      // Fallback para template de token se template PIX não estiver configurado
      return process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT || 
             process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TOKEN || '';
    default:
      throw new Error('Template não suportado');
  }
};

// Função para validar os parâmetros do template
const validateTemplateParams = (params: EmailTemplateParams, template: EmailTemplate): void => {
  if (template === 'templateToken') {
    const tokenParams = params as TokenEmailParams;
    const requiredParams: (keyof TokenEmailParams)[] = [
      'token_amount',
      'property_id',
      'purchase_date',
      'purchase_time',
      'subject'
    ];

    for (const param of requiredParams) {
      if (!tokenParams[param]) {
        throw new Error(`Parâmetro obrigatório ausente: ${param}`);
      }
    }
  } else if (template === 'templateInvoice') {
    const invoiceParams = params as InvoiceEmailParams;
    const requiredParams: (keyof InvoiceEmailParams)[] = [
      'invoice_number',
      'amount',
      'due_date',
      'property_id',
      'issue_date',
      'issue_time',
      'subject'
    ];

    for (const param of requiredParams) {
      if (!invoiceParams[param]) {
        throw new Error(`Parâmetro obrigatório ausente: ${param}`);
      }
    }
  } else if (template === 'templatePixReceipt') {
    const pixParams = params as PixReceiptEmailParams;
    const requiredParams: (keyof PixReceiptEmailParams)[] = [
      'token_amount',
      'total_amount',
      'property_id',
      'purchase_date',
      'purchase_time',
      'subject'
    ];

    for (const param of requiredParams) {
      if (!pixParams[param]) {
        throw new Error(`Parâmetro obrigatório ausente: ${param}`);
      }
    }
  }
};

// Função para enviar email via EmailJS client SDK com retry
export const sendEmailViaAPI = async (
  templateParams: EmailTemplateParams,
  template: EmailTemplate,
  retries = 3
): Promise<EmailResponse> => {
  validateTemplateParams(templateParams, template);
  const sanitizedParams = sanitizeTemplateParams(templateParams);

  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
  const TEMPLATE_ID = getTemplateId(template);
  const USER_ID = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

  // Debug das variáveis de ambiente
  console.log('EmailJS Debug:', {
    template,
    SERVICE_ID: SERVICE_ID ? 'Configurado' : 'Não configurado',
    TEMPLATE_ID: TEMPLATE_ID ? 'Configurado' : 'Não configurado',
    USER_ID: USER_ID ? 'Configurado' : 'Não configurado',
    templateParams: Object.keys(sanitizedParams)
  });

  if (!SERVICE_ID) {
    throw new Error('EmailJS Service ID não configurado');
  }

  if (!TEMPLATE_ID) {
    throw new Error(`ID do template ${template} não encontrado. Verifique a configuração das variáveis de ambiente.`);
  }

  if (!USER_ID) {
    throw new Error('EmailJS Public Key não configurada');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Tentativa ${attempt}`);

      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        sanitizedParams,
        USER_ID
      );

      return {
        success: true,
        message: 'Email enviado com sucesso',
        data: result,
      };
    } catch (error) {
      // Improved error logging
      let errorDetails = error;
      try {
        errorDetails = JSON.stringify(error);
      } catch {}

      console.error(`Tentativa ${attempt} falhou:`, errorDetails);

      if (attempt === retries) {
        const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Erro desconhecido');
        throw new Error(`Falha ao enviar email após ${retries} tentativas: ${errorMessage}`);
      }

      // Aguarda antes da próxima tentativa (backoff exponencial com jitter)
      const backoff = 1000 * attempt + Math.floor(Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw new Error('Erro inesperado no envio de email');
};

export const sendPurchaseEmail = async (
  amount: number,
  username: string | null,
  propertyId: number
): Promise<EmailResponse> => {

  if (!amount || amount <= 0) {
    throw new Error('Quantidade inválida');
  }

  const templateParams: TokenEmailParams = {
    token_amount: amount.toString(),
    username: username,
    property_id: propertyId.toString(),
    purchase_date: new Date().toLocaleDateString('pt-BR'),
    purchase_time: new Date().toLocaleTimeString('pt-BR'),
    subject: `Compra adicional de ${amount} tokens solicitada`,
  };

  return sendEmailViaAPI(templateParams, 'templateToken');
};

export const sendInvoiceEmail = async (
  invoiceData: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    propertyId: number;
    boletoUrl?: string;
  }
): Promise<EmailResponse> => {
  const { invoiceNumber, amount, dueDate, propertyId, boletoUrl } = invoiceData;

  const templateParams: InvoiceEmailParams = {
    invoice_number: invoiceNumber,
    amount: amount.toString(),
    due_date: dueDate,
    property_id: propertyId.toString(),
    issue_date: new Date().toLocaleDateString('pt-BR'),
    issue_time: new Date().toLocaleTimeString('pt-BR'),
    subject: `Nova fatura ${invoiceNumber} gerada`,
    boleto_url: boletoUrl
  };

  return sendEmailViaAPI(templateParams, 'templateInvoice');
};

export const sendPixReceiptEmail = async (
  receiptData: {
    tokenAmount: number;
    totalAmount: number;
    username: string | null;
    propertyId: number;
    receiptUrl?: string;
    pixTransactionId?: string;
  }
): Promise<EmailResponse> => {
  const { tokenAmount, totalAmount, username, propertyId, receiptUrl, pixTransactionId } = receiptData;

  if (!tokenAmount || tokenAmount <= 0) {
    throw new Error('Quantidade de tokens inválida');
  }

  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Valor total inválido');
  }

  // Verifica se template PIX específico está disponível
  const pixTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT;
  
  console.log('🔍 Debug sendPixReceiptEmail:', {
    pixTemplateId: pixTemplateId ? 'Configurado' : 'NÃO CONFIGURADO',
    templateUsado: pixTemplateId ? 'templatePixReceipt' : 'templateToken (FALLBACK)',
    receiptData: {
      tokenAmount,
      totalAmount,
      username,
      propertyId,
      receiptUrl: receiptUrl ? 'Presente' : 'Ausente',
      pixTransactionId: pixTransactionId || 'Ausente'
    }
  });
  
  if (pixTemplateId) {
    // Use template PIX específico com parâmetros completos
    const templateParams: PixReceiptEmailParams = {
      token_amount: tokenAmount.toString(),
      total_amount: totalAmount.toFixed(2),
      username: username,
      property_id: propertyId.toString(),
      purchase_date: new Date().toLocaleDateString('pt-BR'),
      purchase_time: new Date().toLocaleTimeString('pt-BR'),
      receipt_url: receiptUrl,
      pix_transaction_id: pixTransactionId,
      subject: `Comprovante PIX - Compra de ${tokenAmount} tokens${pixTransactionId ? ` (ID: ${pixTransactionId})` : ''}`
    };

    console.log('✅ Usando templatePixReceipt com parâmetros:', {
      template: 'templatePixReceipt',
      parametros: Object.keys(templateParams),
      total_amount: templateParams.total_amount,
      receipt_url: templateParams.receipt_url,
      pix_transaction_id: templateParams.pix_transaction_id
    });

    return sendEmailViaAPI(templateParams, 'templatePixReceipt');
  } else {
    // Fallback: use template de token com parâmetros adaptados
    const templateParams: TokenEmailParams = {
      token_amount: tokenAmount.toString(),
      username: username,
      property_id: propertyId.toString(),
      purchase_date: new Date().toLocaleDateString('pt-BR'),
      purchase_time: new Date().toLocaleTimeString('pt-BR'),
      subject: `Comprovante PIX - Compra de ${tokenAmount} tokens (Total: R$ ${totalAmount.toFixed(2)})${pixTransactionId ? ` - ID: ${pixTransactionId}` : ''}`
    };

    console.warn('⚠️ USANDO FALLBACK templateToken - Parâmetros PIX perdidos!', {
      template: 'templateToken',
      parametros: Object.keys(templateParams),
      parametrosPerdidos: ['total_amount', 'receipt_url', 'pix_transaction_id'],
      valorTotal: totalAmount.toFixed(2),
      receiptUrl: receiptUrl,
      pixTransactionId: pixTransactionId
    });

    return sendEmailViaAPI(templateParams, 'templateToken');
  }
}; 