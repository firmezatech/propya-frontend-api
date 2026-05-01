# Configuração do Sistema de Email

## Variáveis de Ambiente Necessárias

Para o funcionamento completo do sistema de envio de emails, as seguintes variáveis de ambiente devem ser configuradas:

### Básicas (Obrigatórias)
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=seu_service_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=sua_public_key
NEXT_PUBLIC_EMAILJS_TEMPLATE_TOKEN_ID=template_id_tokens
NEXT_PUBLIC_EMAILJS_TEMPLATE_INVOICE_ID=template_id_invoices
```

### Opcional (PIX Receipt)
```
NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID=template_id_pix_receipt
```

## Comportamento do Sistema

### Com Template PIX Configurado
Quando `NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID` estiver configurado, o sistema usará um template específico para comprovantes PIX com os seguintes parâmetros:

- `token_amount`: Quantidade de tokens
- `total_amount`: Valor total pago
- `username`: Nome do usuário
- `property_id`: ID da propriedade
- `payment_date`: Data do pagamento
- `payment_time`: Hora do pagamento
- `receipt_url`: URL do comprovante (se disponível)
- `subject`: Assunto do email

### Sem Template PIX (Fallback)
Se `NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID` não estiver configurado, o sistema usará automaticamente o template de tokens (`NEXT_PUBLIC_EMAILJS_TEMPLATE_TOKEN_ID`) com parâmetros adaptados:

- `token_amount`: Quantidade de tokens
- `username`: Nome do usuário
- `property_id`: ID da propriedade
- `purchase_date`: Data da compra
- `purchase_time`: Hora da compra
- `subject`: Assunto incluindo valor total

## Status Atual

⚠️ **Template PIX não configurado**: O sistema está usando o template de tokens como fallback.

Para melhor experiência do usuário, recomenda-se criar e configurar um template específico para comprovantes PIX no EmailJS.

## Debug

O sistema inclui logs detalhados no console do navegador para ajudar na identificação de problemas:

- Status das variáveis de ambiente
- Parâmetros enviados para o template
- Erros específicos com mensagens claras

## Erro Atual Resolvido

O erro "ID do template templatePixReceipt não encontrado" foi resolvido implementando um sistema de fallback que permite o funcionamento mesmo sem template específico configurado. 