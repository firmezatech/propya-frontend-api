# Componente PixQRCodeGenerator

Este componente e hook foram criados para encapsular toda a lógica de geração de chaves PIX e QR Codes, tornando o código mais modular e reutilizável.

## Arquivos

- `PixQRCodeGenerator.tsx` - Componente principal com hook e display
- `src/services/pix-config.ts` - Configurações e interfaces PIX centralizadas

## Funcionalidades

### ✅ O que foi extraído:
- ✅ Geração de chave PIX conforme padrão EMV brasileiro
- ✅ Cálculo de CRC16 para validação da chave
- ✅ Geração de QR Code dinâmico
- ✅ Cálculo de valores com taxa (7,5%)
- ✅ Funcionalidade de copiar chave PIX
- ✅ Interface visual para exibição do QR Code
- ✅ Estados de loading e erro
- ✅ Validação de configuração PIX

## Como Usar

### Hook usePixGenerator

```typescript
import { usePixGenerator } from './components/PixQRCodeGenerator';
import { PixData } from '../../../../services/pix-config';

function MyComponent() {
  const pixGenerator = usePixGenerator();
  
  // Gerar PIX para um valor
  const handleGeneratePix = async () => {
    try {
      const pixData = await pixGenerator.generatePixData(1000);
      console.log('PIX gerado:', pixData);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
    }
  };
  
  // Copiar chave PIX
  const handleCopy = () => {
    if (pixGenerator.pixData) {
      pixGenerator.copyToClipboard(pixGenerator.pixData.copyPasteKey);
    }
  };
  
  // Limpar dados PIX
  const handleClear = () => {
    pixGenerator.clearPixData();
  };
  
  return (
    <div>
      {pixGenerator.isGenerating && <p>Gerando PIX...</p>}
      {pixGenerator.pixData && <p>Total: R$ {pixGenerator.pixData.amount}</p>}
      {pixGenerator.isCopied && <p>Copiado!</p>}
    </div>
  );
}
```

### Componente PixQRCodeDisplay

```typescript
import { PixQRCodeDisplay, usePixGenerator } from './components/PixQRCodeGenerator';
import { PixData } from '../../../../services/pix-config';

function MyPaymentModal() {
  const pixGenerator = usePixGenerator();
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <div>
      {pixGenerator.pixData && (
        <PixQRCodeDisplay
          pixData={pixGenerator.pixData}
          qrCodeDataUrl={pixGenerator.qrCodeDataUrl}
          amount={1000}
          formatCurrency={formatCurrency}
          className="custom-styles"
        />
      )}
    </div>
  );
}
```

## API do Hook usePixGenerator

### Estados Retornados

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `pixData` | `PixData \| null` | Dados do PIX gerado |
| `qrCodeDataUrl` | `string \| null` | URL do QR Code em base64 |
| `isCopied` | `boolean` | Se a chave foi copiada recentemente |
| `isGenerating` | `boolean` | Se está gerando PIX no momento |

### Funções Retornadas

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `generatePixData` | `amount: number` | `Promise<PixData>` | Gera dados PIX para um valor |
| `copyToClipboard` | `text: string` | `Promise<void>` | Copia texto para área de transferência |
| `clearPixData` | - | `void` | Limpa todos os dados PIX |
| `calculateTotalAmount` | `baseAmount: number` | `number` | Calcula valor com taxa de 7,5% |

## Interfaces PIX

Todas as interfaces PIX estão centralizadas em `src/services/pix-config.ts`:

```typescript
// Interface para configuração PIX
interface PixConfig {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantCity: string;
  merchantCategoryCode: string;
}

// Interface para dados PIX gerados
interface PixData {
  amount: number;           // Valor total com taxa
  copyPasteKey: string;     // Chave PIX para copiar/colar
  qrCode: string;          // URL do QR Code em base64
}
```

## Props do PixQRCodeDisplay

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `pixData` | `PixData` | ✅ | Dados do PIX |
| `qrCodeDataUrl` | `string \| null` | ✅ | URL do QR Code |
| `amount` | `number` | ✅ | Valor base (sem taxa) |
| `formatCurrency` | `(value: number) => string` | ✅ | Função para formatar moeda |
| `className` | `string` | ❌ | Classes CSS customizadas |

## Configuração PIX

O componente usa a configuração centralizada em `src/services/pix-config.ts`. 

### Configurar dados reais:

1. **Via variáveis de ambiente (.env.local):**
```bash
NEXT_PUBLIC_PIX_KEY=12345678901
NEXT_PUBLIC_PIX_MERCHANT_NAME=Seu Nome
NEXT_PUBLIC_PIX_MERCHANT_CITY=SUA CIDADE
```

2. **Via edição direta do arquivo:**
```typescript
// src/services/pix-config.ts
export const pixConfig: PixConfig = {
  pixKey: "12345678901",
  pixKeyType: 'cpf',
  merchantName: "Seu Nome",
  merchantCity: "SUA CIDADE",
  merchantCategoryCode: "0000"
};
```

## Validação Automática

O componente valida automaticamente:
- ✅ Chave PIX configurada
- ✅ Formato correto da chave (CPF, CNPJ, email, etc.)
- ✅ Tamanho dos campos (nome máx. 25 chars, cidade máx. 15 chars)
- ✅ Geração correta do CRC16

## Exemplo Completo

```typescript
import React, { useState } from 'react';
import { usePixGenerator, PixQRCodeDisplay } from './components/PixQRCodeGenerator';
import { PixData } from '../../../../services/pix-config';

export default function TokenPurchase() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const pixGenerator = usePixGenerator();
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const handleBuyTokens = async (amount: number) => {
    setSelectedAmount(amount);
    try {
      await pixGenerator.generatePixData(amount);
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
    }
  };
  
  const handleCancel = () => {
    setShowModal(false);
    setSelectedAmount(null);
    pixGenerator.clearPixData();
  };
  
  return (
    <div>
      <button onClick={() => handleBuyTokens(1000)}>
        Comprar 1000 tokens
      </button>
      
      {showModal && selectedAmount && pixGenerator.pixData && (
        <div className="modal">
          <h2>Pagamento PIX</h2>
          
          <div className="payment-summary">
            <p>Tokens: {selectedAmount}</p>
            <p>Taxa (7,5%): {formatCurrency(selectedAmount * 0.075)}</p>
            <p>Total: {formatCurrency(pixGenerator.calculateTotalAmount(selectedAmount))}</p>
          </div>
          
          <PixQRCodeDisplay
            pixData={pixGenerator.pixData}
            qrCodeDataUrl={pixGenerator.qrCodeDataUrl}
            amount={selectedAmount}
            formatCurrency={formatCurrency}
          />
          
          <button onClick={handleCancel}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
```

## Benefícios da Modularização

### 🎯 Antes:
- Código PIX misturado com lógica da página
- +150 linhas de código na página principal
- Difícil de testar e reutilizar
- Estados PIX espalhados pela página

### ✅ Depois:
- Lógica PIX isolada em componente dedicado
- Página principal mais limpa e focada
- Hook reutilizável em outras páginas
- Componente visual independente
- Fácil de testar isoladamente
- Estados PIX encapsulados

## Próximos Passos

- [ ] Adicionar testes unitários para o componente
- [ ] Criar variações do componente (tamanhos diferentes)
- [ ] Adicionar suporte a outros tipos de pagamento
- [ ] Implementar cache de QR Codes gerados
- [ ] Adicionar analytics de uso do PIX 