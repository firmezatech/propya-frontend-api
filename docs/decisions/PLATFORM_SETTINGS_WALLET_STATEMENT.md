# Decisões de Design — Platform Settings: Configurações do Extrato do Inquilino

**Data:** 2026-06-12
**Status:** Design fechado — pronto para implementação
**Feature folder:** `src/features/admin-tenant-settings/` (renomeado)
**Decision doc de backend:** `propya-backend-api/docs/decisions/PLATFORM_SETTINGS_WALLET_STATEMENT.md`

---

## Contexto

O extrato da carteira do inquilino (`FmzWalletStatementPage.tsx`) contém valores hardcoded de identidade da plataforma:
- `FirmezaToken` — nome do token/marca
- `suporte@propya.ai` — e-mail de suporte
- `Propya Gestão Imobiliária` — razão social
- `CNPJ 00.000.000/0001-00` — CNPJ (ainda placeholder)
- `São Paulo, SP` — endereço

Esses valores precisam ser editáveis por admins sem deploy. A tabela `admin_panel.platform_parameters` já existe e suporta `value_type = 'text'`.

---

## Decisões

### 1. Reutilizar a página `tenant-settings` — não criar página nova

A página existente em `/connected/tenant-settings` (`FmzAdminTenantSettings`) já gerencia configurações de taxas e metas por inquilino. Em vez de criar uma nova rota, ela é expandida para abarcar configurações globais da plataforma.

**Por quê:** evita proliferação de páginas admin com função similar. A página vira um hub de configurações gerais.

**Alternativa descartada:** nova página `/connected/admin-platform-settings` — criaria fragmentação sem benefício real.

### 2. Renomear a página para "Configurações da Plataforma"

O label no sidebar e o título da página mudam de "Tenant Settings" para **"Configurações da Plataforma"**. O path da rota Next.js (`/connected/tenant-settings`) pode manter-se ou ser renomeado — definir na implementação. Se renomeado, requer migration em `admin_panel.pages`.

### 3. Nova seção "Configurações do extrato do inquilino"

Dentro da página, adicionar um novo grid de edição com os 5 campos abaixo. Os campos existentes (taxas e metas) permanecem intactos.

| Campo | Chave em `platform_parameters` | Tipo |
|---|---|---|
| Nome da marca/token | `brand_name` | text |
| Razão social | `company_legal_name` | text |
| CNPJ | `company_cnpj` | text |
| Endereço | `company_address` | text |
| E-mail de suporte | `support_email` | text |

### 4. Tagline não é parametrizada

`"A revolução imobiliária começou."` fica hardcoded. É cópia de marketing, não dado operacional — não precisa ser editável por admin.

### 5. Wallet statement consome os valores via API

O `FmzWalletStatementPage` chama `GET /platform/info` para buscar os 5 campos ao carregar. Enquanto carrega, mantém os valores anteriores como placeholder. Sem impacto perceptível no tempo de renderização — o extrato já é uma página de navegação intencional.

---

## Infraestrutura a criar/modificar

### Frontend

| Ação | Arquivo |
|---|---|
| Criar | `src/features/admin-tenant-settings/services/fmz-platform-params-api.ts` |
| Modificar | `src/features/admin-tenant-settings/components/FmzAdminTenantSettings.tsx` — nova seção |
| Modificar | `src/features/admin-tenant-settings/domain/fmz-admin-tenant-settings.types.ts` — novos tipos |
| Modificar | `src/features/tenant-portal/wallet/components/FmzWalletStatementPage.tsx` — substituir hardcoded |

### Backend

Ver `propya-backend-api/docs/decisions/PLATFORM_SETTINGS_WALLET_STATEMENT.md`.

---

## Ordem de execução

```
1. Migration: 5 rows em platform_parameters + (opcional) rename da page no DB
2. Backend: controller + rotas + routePermissions
3. Frontend: service de platform params
4. Frontend: nova seção na página admin
5. Frontend: wallet statement consome o service
```
