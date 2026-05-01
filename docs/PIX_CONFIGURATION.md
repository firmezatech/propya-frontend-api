# Configuração PIX - Firmeza Token

Este documento explica como configurar seus dados bancários reais para gerar chaves PIX válidas no sistema.

## 📂 Arquivos Consolidados

Todas as configurações e interfaces PIX estão centralizadas em:
- **`src/services/pix-config.ts`** - Configurações, interfaces e validações PIX

## 🚨 IMPORTANTE

**NUNCA commite dados bancários reais no Git!**
Use sempre variáveis de ambiente para informações sensíveis.

## Método 1: Variáveis de Ambiente (Recomendado)

### 1. Criar arquivo .env.local

Na raiz do projeto, crie um arquivo `.env.local`:

```bash
# Dados PIX - CONFIGURE AQUI SEUS DADOS REAIS
NEXT_PUBLIC_PIX_KEY=12345678901                    # Sua chave PIX real
NEXT_PUBLIC_PIX_MERCHANT_NAME=Firmeza Tecnologia   # Nome que aparece no PIX
NEXT_PUBLIC_PIX_MERCHANT_CITY=SAO PAULO           # Sua cidade
```

### 2. Adicionar ao .gitignore

Certifique-se que o arquivo `.env.local` está no `.gitignore`:

```
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Método 2: Edição Direta do Arquivo

⚠️ **Use apenas para desenvolvimento local**

Edite o arquivo `src/services/pix-config.ts`:

```typescript
export const pixConfig: PixConfig = {
  pixKey: "sua-chave-pix-aqui",           // Substitua pela sua chave PIX real
  pixKeyType: 'cpf',                      // Tipo da chave (veja tipos abaixo)
  merchantName: "Seu Nome ou Empresa",    // Nome que aparece no PIX
  merchantCity: "SUA CIDADE",             // Sua cidade
  merchantCategoryCode: "0000"            // Código da categoria
};
```

## Tipos de Chave PIX

### CPF
```typescript
pixKey: "12345678901",        // Apenas números
pixKeyType: 'cpf'
```

### CNPJ
```typescript
pixKey: "12345678000195",     // Apenas números
pixKeyType: 'cnpj'
```

### Email
```typescript
pixKey: "contato@empresa.com",
pixKeyType: 'email'
```

### Telefone
```typescript
pixKey: "+5511999999999",     // Formato internacional
pixKeyType: 'phone'
```

### Chave Aleatória
```typescript
pixKey: "12345678-1234-1234-1234-123456789012",  // 32 caracteres
pixKeyType: 'random'
```

## Exemplo Completo - .env.local

```bash
# Exemplo com CPF
NEXT_PUBLIC_PIX_KEY=12345678901
NEXT_PUBLIC_PIX_MERCHANT_NAME=João Silva
NEXT_PUBLIC_PIX_MERCHANT_CITY=SAO PAULO

# Exemplo com CNPJ
NEXT_PUBLIC_PIX_KEY=12345678000195
NEXT_PUBLIC_PIX_MERCHANT_NAME=Empresa Ltda
NEXT_PUBLIC_PIX_MERCHANT_CITY=RIO DE JANEIRO

# Exemplo com Email
NEXT_PUBLIC_PIX_KEY=pix@empresa.com
NEXT_PUBLIC_PIX_MERCHANT_NAME=Minha Empresa
NEXT_PUBLIC_PIX_MERCHANT_CITY=BELO HORIZONTE
```

## Validação da Configuração

O sistema valida automaticamente sua configuração e exibe avisos se:

- ✅ Chave PIX não está configurada
- ✅ Tipo de chave não corresponde ao formato
- ✅ Nome do comerciante excede 25 caracteres
- ✅ Cidade excede 15 caracteres
- ✅ Formatos específicos de CPF, CNPJ, email, etc.

## Como Obter sua Chave PIX

### 1. Via App do Banco
- Abra o app do seu banco
- Vá para a seção PIX
- Escolha "Minhas Chaves"
- Copie a chave desejada

### 2. Tipos Recomendados
- **CPF/CNPJ**: Mais fácil de lembrar
- **Email**: Funciona bem se você não mudar de email
- **Telefone**: Formato +5511999999999
- **Chave Aleatória**: Mais segura, mas difícil de lembrar

## Testando a Configuração

1. Configure suas variáveis de ambiente
2. Reinicie o servidor de desenvolvimento
3. Acesse a página de compra de tokens
4. Verifique se não há avisos de configuração

## Produção

Para ambiente de produção, configure as variáveis de ambiente no seu provedor de hospedagem:

### Vercel
```bash
vercel env add NEXT_PUBLIC_PIX_KEY
vercel env add NEXT_PUBLIC_PIX_MERCHANT_NAME
vercel env add NEXT_PUBLIC_PIX_MERCHANT_CITY
```

### Netlify
```bash
# No dashboard do Netlify > Site settings > Environment variables
NEXT_PUBLIC_PIX_KEY=sua-chave-aqui
NEXT_PUBLIC_PIX_MERCHANT_NAME=Seu Nome
NEXT_PUBLIC_PIX_MERCHANT_CITY=SUA CIDADE
```

### Docker
```dockerfile
ENV NEXT_PUBLIC_PIX_KEY=sua-chave-aqui
ENV NEXT_PUBLIC_PIX_MERCHANT_NAME=Seu Nome
ENV NEXT_PUBLIC_PIX_MERCHANT_CITY=SUA CIDADE
```

## Segurança

- ✅ Use sempre variáveis de ambiente
- ✅ Mantenha o .env.local no .gitignore
- ✅ Não compartilhe chaves PIX publicamente
- ✅ Use chaves aleatórias para maior segurança
- ❌ Nunca commite dados reais no código

## Solução de Problemas

### QR Code não funciona
- Verifique se a chave PIX está correta
- Teste fazendo um PIX manual primeiro
- Confirme o formato da chave (CPF sem pontos, etc.)

### Erro de validação
- Verifique o console do navegador
- Certifique-se que o tipo da chave está correto
- Nome não pode ter mais de 25 caracteres
- Cidade não pode ter mais de 15 caracteres

### PIX não aparece no banco
- Aguarde alguns minutos (pode haver delay)
- Verifique se a chave PIX está ativa no seu banco
- Teste com valores pequenos primeiro

## Suporte

Se precisar de ajuda, verifique:
1. Console do navegador para erros
2. Validação automática na interface
3. Logs do servidor para problemas de geração 