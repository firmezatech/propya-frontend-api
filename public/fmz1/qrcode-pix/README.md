# QR Codes PIX - Documentação

Este diretório contém documentação sobre a implementação de QR Codes PIX dinâmicos.

## Implementação Atual:

O sistema agora gera QR Codes PIX dinamicamente usando a biblioteca `qrcode`:

### Funcionalidades:
- **Geração Dinâmica**: QR Codes são gerados em tempo real para qualquer valor
- **Chave PIX Personalizada**: Cada transação tem uma chave PIX única
- **Valor com Taxa**: Valor total sempre inclui 7,5% de taxa de compra
- **Formato Data URL**: QR Codes são gerados como base64 data URLs

### Configuração Técnica:

- **Biblioteca**: `qrcode` (npm package)
- **Formato**: PNG base64 data URL
- **Tamanho**: 200x200 pixels
- **Margem**: 1 pixel
- **Cores**: Preto (#000000) e Branco (#FFFFFF)

### Funções Implementadas:

1. **`calculateTotalAmount(baseAmount)`**: Calcula valor com taxa de 7,5%
2. **`generatePixKey(amount)`**: Gera chave PIX baseada no valor
3. **`generateQRCode(pixKey)`**: Gera QR Code como data URL
4. **`generatePixData(amount)`**: Gera dados completos do PIX

### Estados do Componente:

- **`pixData`**: Dados completos da transação PIX
- **`qrCodeDataUrl`**: URL base64 do QR Code gerado
- **`isCopied`**: Estado do botão de copiar chave PIX

## Vantagens da Implementação Dinâmica:

1. **Flexibilidade**: Suporte a qualquer valor sem necessidade de imagens pré-definidas
2. **Chaves Únicas**: Cada transação tem identificador único
3. **Menor Uso de Armazenamento**: Não precisa de múltiplas imagens
4. **Fácil Manutenção**: Apenas código JavaScript para manter 