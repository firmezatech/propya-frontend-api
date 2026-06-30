# Checklist de Implementação — Platform Settings: Configurações do Extrato

**Decision docs:**
- Frontend: `PLATFORM_SETTINGS_WALLET_STATEMENT.md`
- Backend: `propya-backend-api/docs/decisions/PLATFORM_SETTINGS_WALLET_STATEMENT.md`

---

## Regra: nada é executado sem aprovação explícita da Mirella

---

## 1. Banco de dados (migrations)

- [x] Migration `202606120006`: `INSERT` das 5 chaves em `admin_panel.platform_parameters`
  - `brand_name`, `company_legal_name`, `company_cnpj`, `company_address`, `support_email`
- [x] Migration `202606120006`: `INSERT` das 2 permissões + grant ao role `admin`
  - `admin.platform_settings.view`, `admin.platform_settings.manage`
- [x] Migration `202606120007`: `UPDATE admin_panel.pages` — renomear label e path da página
  - `label`: `"Parâmetros"` → `"Configurações da Plataforma"`
  - `path`: `/connected/tenant-settings` → `/connected/platform-settings`

---

## 2. Backend — controller (propya-backend-api)

- [x] Criar `src/modules/admin/platformParams.controller.js`
  - `listPlatformParamsController` → `GET /admin/platform-params`
  - `updatePlatformParamController` → `PATCH /admin/platform-params/:key`
- [x] Criar `src/modules/platform/platform.routes.js`
  - `getPlatformInfoHandler` → `GET /platform/info` (autenticado, sem permissão admin)
- [x] Registrar rotas em `src/modules/admin/routes.js` e `src/server.js`
- [x] Adicionar entradas em `config/routePermissions.js`
- [x] `PLATFORM_IDENTITY_KEYS` + `listAllPlatformParameters` + `updatePlatformParameterTextValue` em `platformParametersRepository.js`
- [x] Revisão system-design-specialist — nenhum achado HIGH/CRITICAL
- [x] `npm test` — 844 testes, 0 falhas
- [ ] **Deploy do backend** — novas rotas só ficam disponíveis após deploy

---

## 3. Frontend — service (admin)

- [x] Criar `src/features/admin-tenant-settings/services/fmz-platform-params-api.ts`
- [x] Exportar via `services/index.ts`
- [x] Tipo `FmzPlatformParam` em `fmz-admin-tenant-settings.types.ts`

---

## 4. Frontend — página admin

- [x] Renomear pasta Next.js: `tenant-settings/` → `platform-settings/`
- [x] H1 e descrição atualizados para "Configurações da Plataforma"
- [x] Sub-componente `PlatformParamField` adicionado
- [x] Nova seção "Configurações do extrato do inquilino" no JSX
- [x] State + handlers (`setPlatformParamValue`, `savePlatformParam`) implementados
- [ ] **Seção visível na UI** — depende do backend estar rodando com as novas rotas

---

## 5. Frontend — service (tenant / wallet statement)

- [x] Criar `src/features/tenant-portal/services/fmz-platform-info-api.ts`
  - `getPlatformInfo()` → `GET /platform/info` com fallback silencioso

---

## 6. Frontend — Wallet Statement

- [x] Import de `getPlatformInfo` e tipo `FmzPlatformInfo`
- [x] `platformInfo` adicionado ao state e buscado no `useEffect`
- [x] 4 valores hardcoded substituídos — fallback para valores padrão se API falhar

---

## 7. Teste end-to-end

- [ ] Backend rodando com as novas rotas
- [ ] Admin acessa `/connected/platform-settings`, vê a nova seção e edita os 5 campos
- [ ] Usuário abre o extrato da carteira — valores refletem o que foi salvo
- [ ] Download do PDF também reflete os valores do banco
