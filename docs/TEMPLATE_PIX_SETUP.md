# 🚨 CONFIGURAÇÃO URGENTE: Template PIX para EmailJS

## Problema Identificado

❌ **Os parâmetros `total_amount`, `receipt_url` e `pix_transaction_id` não estão sendo enviados para o template**

**Causa:** A variável de ambiente `NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID` não está configurada, fazendo o sistema usar fallback para o template básico de tokens.

## Solução Passo a Passo

### 1. 🔧 Configurar Template no EmailJS

1. Acesse seu painel do [EmailJS](https://www.emailjs.com/)
2. Vá em **Email Templates**
3. Clique em **Create New Template**
4. Configure o template com estes parâmetros:

#### Template ID: 
Guarde esse ID, você precisará dele!

#### Assunto:
```
{{subject}}
```

#### Conteúdo do Email:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprovante PIX - Firmeza Token</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
            🏠 Firmeza Token - Comprovante PIX
        </h1>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Detalhes da Transação</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Cliente:</td>
                    <td style="padding: 8px 0;">{{username}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Tokens Comprados:</td>
                    <td style="padding: 8px 0;">{{token_amount}} tokens</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Valor Total Pago:</td>
                    <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">R$ {{total_amount}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Propriedade ID:</td>
                    <td style="padding: 8px 0;">{{property_id}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Data/Hora:</td>
                    <td style="padding: 8px 0;">{{purchase_date}} às {{purchase_time}}</td>
                </tr>
                {{#pix_transaction_id}}
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">ID Transação PIX:</td>
                    <td style="padding: 8px 0; font-family: monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">{{pix_transaction_id}}</td>
                </tr>
                {{/pix_transaction_id}}
            </table>
        </div>

        {{#receipt_url}}
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">📎 Comprovante Anexado</h3>
            <p>O comprovante de pagamento foi enviado e está disponível em:</p>
            <a href="{{receipt_url}}" style="color: #2563eb; text-decoration: none; font-weight: bold;" target="_blank">
                🔗 Ver Comprovante
            </a>
        </div>
        {{/receipt_url}}

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-top: 0;">⏳ Próximos Passos</h3>
            <ul style="color: #92400e;">
                <li>Seus tokens serão processados em até 24 horas</li>
                <li>Você receberá uma confirmação quando os tokens forem ativados</li>
                <li>Os tokens aparecerão no seu painel do investidor</li>
            </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            Este é um email automático da plataforma Firmeza Token.<br>
            Em caso de dúvidas, entre em contato conosco.
        </p>
    </div>
</body>
</html>
```

### 2. 🔑 Configurar Variável de Ambiente

1. Copie o **Template ID** do EmailJS
2. Abra seu arquivo `.env.local` (ou crie baseado no `docs/env.local.example`)
3. Adicione a linha:

```env
NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID=seu_template_id_aqui
```

### 3. 🔄 Reiniciar Aplicação

```bash
npm run dev
```

## Como Verificar se Está Funcionando

1. Faça uma compra de tokens via PIX
2. Envie o comprovante
3. Verifique o console do navegador para ver os logs:

```
🔍 Debug sendPixReceiptEmail: {
  pixTemplateId: 'Configurado',
  templateUsado: 'templatePixReceipt'
}

✅ Usando templatePixReceipt com parâmetros: {
  template: 'templatePixReceipt',
  total_amount: '107.50',
  receipt_url: 'https://...',
  pix_transaction_id: 'FMZ12345678'
}
```

## Debug: Se Ainda Não Funcionar

Se você vir este log no console:

```
⚠️ USANDO FALLBACK templateToken - Parâmetros PIX perdidos!
```

Significa que a variável ainda não está configurada. Verifique:

1. ✅ Arquivo `.env.local` existe na **raiz** do projeto
2. ✅ Variável `NEXT_PUBLIC_EMAILJS_TEMPLATE_PIX_RECEIPT_ID` está configurada
3. ✅ Servidor foi reiniciado após adicionar a variável
4. ✅ Template ID está correto no EmailJS

## Parâmetros Disponíveis no Template

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `{{token_amount}}` | Quantidade de tokens | `100` |
| `{{total_amount}}` | Valor total com taxa | `107.50` |
| `{{username}}` | Nome do usuário | `João Silva` |
| `{{property_id}}` | ID da propriedade | `1` |
| `{{purchase_date}}` | Data da compra | `25/12/2024` |
| `{{purchase_time}}` | Hora da compra | `14:30:15` |
| `{{receipt_url}}` | URL do comprovante | `https://ipfs.io/...` |
| `{{pix_transaction_id}}` | ID da transação PIX | `FMZ12345678` |
| `{{subject}}` | Assunto do email | `Comprovante PIX - Compra de 100 tokens` |

## Status Atual

❌ **Template PIX não configurado** - Sistema usando fallback
✅ **Após configuração** - Todos os parâmetros serão enviados corretamente

---

**⚡ Urgente:** Configure isso para garantir que todos os dados importantes (valor total, comprovante e ID da transação) sejam enviados nos emails de comprovante PIX! 