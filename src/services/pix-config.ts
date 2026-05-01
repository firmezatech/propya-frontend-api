// Configuração PIX - Firmeza Tecnologia
// Este arquivo contém as configurações para geração de chaves PIX reais

// Interface para dados de configuração do PIX
export interface PixConfig {
  pixKey: string; // Sua chave PIX real
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string; // Nome que aparecerá no PIX
  merchantCity: string; // Cidade que aparecerá no PIX
  merchantCategoryCode: string; // Código da categoria (0000 para geral)
}

// Interface para dados do PIX gerado
export interface PixData {
  qrCode: string;        // URL do QR Code em base64
  copyPasteKey: string;  // Chave PIX para copiar/colar
  amount: number;        // Valor total com taxa incluída
  transactionId?: string; // ID único da transação PIX
}

// CONFIGURAÇÃO PRINCIPAL - ALTERE AQUI SEUS DADOS REAIS
export const pixConfig: PixConfig = {
  // IMPORTANTE: Substitua pelos seus dados reais
  pixKey: process.env.NEXT_PUBLIC_PIX_KEY || "",
  pixKeyType: (process.env.NEXT_PUBLIC_PIX_TYPE || '') as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
  merchantName: process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME || "",
  merchantCity: process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY || "",
  merchantCategoryCode: process.env.NEXT_PUBLIC_PIX_MERCHANT_CATEGORY_CODE || "0000"
};

// Validação da configuração PIX
export const validatePixConfig = (config: PixConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar chave PIX
  if (!config.pixKey || config.pixKey === "00000000000" || config.pixKey === "seu-cpf-ou-chave-pix-aqui") {
    errors.push("Chave PIX não configurada ou usando valor padrão");
  }
  
  // Validar tipo de chave
  const validTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'];
  if (!validTypes.includes(config.pixKeyType)) {
    errors.push("Tipo de chave PIX inválido");
  }
  
  // Validar nome do comerciante
  if (!config.merchantName || config.merchantName.length < 1 || config.merchantName.length > 25) {
    errors.push("Nome do comerciante deve ter entre 1 e 25 caracteres");
  }
  
  // Validar cidade
  if (!config.merchantCity || config.merchantCity.length < 1 || config.merchantCity.length > 15) {
    errors.push("Cidade deve ter entre 1 e 15 caracteres");
  }
  
  // Validar chave por tipo
  switch (config.pixKeyType) {
    case 'cpf':
      if (!/^\d{11}$/.test(config.pixKey.replace(/\D/g, ''))) {
        errors.push("CPF deve ter 11 dígitos");
      }
      break;
    case 'cnpj':
      if (!/^\d{14}$/.test(config.pixKey.replace(/\D/g, ''))) {
        errors.push("CNPJ deve ter 14 dígitos");
      }
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.pixKey)) {
        errors.push("Email inválido");
      }
      break;
    case 'phone':
      if (!/^\+55\d{10,11}$/.test(config.pixKey.replace(/\D/g, '+55'))) {
        errors.push("Telefone deve seguir o formato +5511999999999");
      }
      break;
    case 'random':
      if (config.pixKey.length !== 32) {
        errors.push("Chave aleatória deve ter 32 caracteres");
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para formatar chave PIX para exibição
export const formatPixKeyForDisplay = (pixKey: string, type: string): string => {
  switch (type) {
    case 'cpf':
      return pixKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'cnpj':
      return pixKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'phone':
      return pixKey.replace(/(\+55)(\d{2})(\d{4,5})(\d{4})/, '$1 ($2) $3-$4');
    default:
      return pixKey;
  }
};

// Instruções de configuração
export const configInstructions = `
COMO CONFIGURAR SEUS DADOS PIX:

1. Edite o arquivo src/services/pix-config.ts

2. Substitua os valores no objeto pixConfig:
   - pixKey: Sua chave PIX real (CPF, CNPJ, email, telefone ou chave aleatória)
   - pixKeyType: Tipo da sua chave ('cpf', 'cnpj', 'email', 'phone', 'random')
   - merchantName: Seu nome ou nome da empresa (máx. 25 caracteres)
   - merchantCity: Sua cidade (máx. 15 caracteres)

3. Alternativa usando variáveis de ambiente:
   Crie um arquivo .env.local na raiz do projeto com:
   NEXT_PUBLIC_PIX_KEY=sua_chave_pix_aqui
   NEXT_PUBLIC_PIX_MERCHANT_NAME=Seu Nome Aqui
   NEXT_PUBLIC_PIX_MERCHANT_CITY=SUA CIDADE

EXEMPLOS DE CHAVES PIX:
- CPF: 12345678901
- CNPJ: 12345678000195
- Email: contato@empresa.com
- Telefone: +5511999999999
- Aleatória: 12345678-1234-1234-1234-123456789012

IMPORTANTE: Nunca commite dados reais no Git!
Use variáveis de ambiente para dados sensíveis.
`; 