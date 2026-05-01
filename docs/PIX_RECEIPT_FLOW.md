# Fluxo de Upload de Comprovante PIX

Esta documentação descreve o fluxo completo de upload e envio de comprovante PIX implementado no sistema.

## Visão Geral do Fluxo

1. **Usuário seleciona tokens** → Gera QR Code PIX dinâmico
2. **Clica em "Pix realizado!"** → Abre modal de upload de comprovante
3. **Faz upload do comprovante** → Arquivo é enviado para IPFS via Pinata
4. **Sistema envia email** → Comprovante é enviado por email usando EmailJS
5. **Confirmação final** → Modal de processamento é exibido

## Componentes Implementados

### 1. **Estados Adicionados**

```typescript
// Estados de UI
const [isReceiptUploadOpen, setIsReceiptUploadOpen] = useState(false);
const [isReceiptUploading, setIsReceiptUploading] = useState(false);

// Estados para upload de comprovante
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
const [receiptSuccess, setReceiptSuccess] = useState(false);
```

### 2. **Funções Principais**

#### **Validação de Arquivo**
- Tipos aceitos: PDF, JPG, JPEG, PNG
- Tamanho máximo: 5MB
- Validação em tempo real

#### **Upload para IPFS**
- Utiliza API `/api/uploadPinata` existente
- Retorna URL do arquivo no IPFS
- Tratamento de erros robusto

#### **Envio por Email**
- Novo template `templatePixReceipt` no EmailJS
- Inclui dados da transação e link do comprovante
- Sistema de retry implementado

### 3. **Serviço de Email Estendido**

#### **Nova Interface**
```typescript
export interface PixReceiptEmailParams {
  token_amount: string;
  total_amount: string;
  username: string | null;
  property_id: string;
  payment_date: string;
  payment_time: string;
  receipt_url?: string;
  subject: string;
}
```

#### **Nova Função**
```typescript
export const sendPixReceiptEmail = async (receiptData: {
  tokenAmount: number;
  totalAmount: number;
  username: string | null;
  propertyId: number;
  receiptUrl?: string;
}): Promise<EmailResponse>
```

## Interface do Usuário

### **Modal de Upload**
- **Design**: Drag & drop area com visual moderno
- **Feedback**: Mostra arquivo selecionado com ícone
- **Validação**: Mensagens de erro em tempo real
- **Loading**: Indicador de progresso durante upload
- **Cancelamento**: Possibilidade de cancelar a qualquer momento

### **Modal de Processamento**
Após o envio bem-sucedido do comprovante, é exibido um modal com:
- **Ícone animado**: Loading circular em azul
- **Título**: "Estamos processando seu pagamento."
- **Mensagem**: "Seus tokens vão aparecer no painel em breve - e te avisaremos quando ativar tudo certo."
- **Design**: Moderno com bordas arredondadas e animação suave

### **Traduções Implementadas**

#### **Português**
- `uploadReceiptTitle`: "Enviar Comprovante"
- `uploadReceiptMessage`: "Envie o comprovante do seu pagamento PIX..."
- `selectReceiptFile`: "Selecionar arquivo do comprovante"
- `supportedFormats`: "Formatos suportados: PDF, JPG, PNG (máx. 5MB)"
- `receiptSentSuccess`: "Comprovante enviado com sucesso!"
- `receiptSentMessage`: "Recebemos seu comprovante e processaremos sua compra em breve."
- `processingPayment`: "Estamos processando seu pagamento."
- `tokensWillAppear`: "Seus tokens vão aparecer no painel em breve - e te avisaremos quando ativar tudo certo."

#### **Inglês**
- `processingPayment`: "We are processing your payment."
- `tokensWillAppear`: "Your tokens will appear on the dashboard soon - and we'll notify you when everything is ready."
- Traduções correspondentes em inglês para todos os textos

## Configuração Necessária

### **Variáveis de Ambiente**
```env
NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID=template_xxxxxxx
```

### **Template EmailJS**
Criar template no EmailJS com os seguintes parâmetros:
- `{{token_amount}}` - Quantidade de tokens
- `{{total_amount}}` - Valor total com taxa
- `{{username}}` - Nome do usuário
- `{{property_id}}` - ID da propriedade
- `{{payment_date}}` - Data do pagamento
- `{{payment_time}}` - Hora do pagamento
- `{{receipt_url}}` - URL do comprovante no IPFS
- `{{subject}}` - Assunto do email

## Fluxo de Erro e Recuperação

### **Validações Implementadas**
1. **Tipo de arquivo**: Apenas PDF, JPG, PNG
2. **Tamanho**: Máximo 5MB
3. **Seleção obrigatória**: Arquivo deve ser selecionado
4. **Upload**: Validação de resposta da API
5. **Email**: Validação de envio

### **Tratamento de Erros**
- Mensagens específicas para cada tipo de erro
- Possibilidade de tentar novamente
- Estados de loading claros
- Limpeza de estado ao fechar modal

## Melhorias Futuras

1. **Compressão de Imagem**: Reduzir tamanho automaticamente
2. **Preview**: Mostrar preview do arquivo selecionado
3. **Múltiplos Arquivos**: Suporte a vários comprovantes
4. **OCR**: Extrair dados automaticamente do comprovante
5. **Notificações Push**: Confirmar recebimento do comprovante
6. **Dashboard Admin**: Interface para visualizar comprovantes enviados

## Segurança

- **Validação no Frontend**: Tipo e tamanho de arquivo
- **Validação no Backend**: API do Pinata valida arquivos
- **IPFS**: Armazenamento descentralizado e seguro
- **EmailJS**: Envio seguro via serviço terceirizado
- **Sanitização**: Dados são sanitizados antes do envio

## Performance

- **Upload Assíncrono**: Não bloqueia interface
- **Indicadores de Progresso**: Feedback visual claro
- **Retry Automático**: Sistema de tentativas para email
- **Limpeza de Estado**: Memória liberada ao fechar modais 