# Checklist — Token Purchase Page Fast Path

**Decisões:** `TOKEN_PURCHASE_PAGE_FAST_PATH.md`
**Regra:** nada é executado sem aprovação explícita da Mirella.

---

## 1. Backend — quote context com goals (D-4)

- [ ] `loadQuoteContext` em `payment.controller.js`: adicionar `fetchTenantOwnershipGoals(propertyTokenizationId)` em paralelo no `Promise.all`
- [ ] `buildTokenPurchaseContext` em `payment.helpers.js`: incluir campo `goals: []` no objeto retornado (array de `{ id, goalKey, title, description, targetPercentage, targetTokenAmount, rewardDescription, displayOrder }`)
- [ ] Tornar `paymentMethod` opcional no handler `getTokenPurchaseQuote` (remover rejeição quando ausente; o campo não afeta o pricing)
- [ ] Revisão system-design-specialist

---

## 2. Backend — persistência de conquistas (D-5)

> **Nota:** `token_system.tenant_ownership_goal_achievements` já existe no banco com schema completo.
> Schema: `id, goal_id, user_id, property_id, property_tokenization_id, token_balance_at_achievement, ownership_bps_at_achievement, achieved_at, metadata`
> Índices: unique `(goal_id, user_id)`, btree `(user_id, property_tokenization_id)`. **Não criar migration.**

- [ ] `platformSettingsRepository.js`: adicionar `insertGoalAchievement({ goalId, userId, propertyId, propertyTokenizationId, tokenBalanceAtAchievement, ownershipBpsAtAchievement, metadata? })` com `ON CONFLICT (goal_id, user_id) DO NOTHING` (idempotente)
- [ ] `platformSettingsRepository.js`: adicionar `listGoalAchievements({ goalId?, userId?, propertyTokenizationId? })`
- [ ] `tokenSettlementFinalizer.js`: após liquidação com sucesso, comparar `newTokenBalance` com cada goal ativa da tokenização; para cada goal cujo `target_token_amount <= newTokenBalance` → `insertGoalAchievement` (idempotência garantida pelo unique index)
- [ ] Revisão system-design-specialist

---

## 3. Backend — admin view de conquistas (D-6)

- [ ] `GET /admin/tenant-settings/goals/achievements` com query params `propertyTokenizationId`, `goalId`
  - Response: `{ achievements: [{ tenantUserId, tenantName, goalId, goalTitle, achievedAt, tokenBalanceAtAchievement }] }`
- [ ] `config/routePermissions.js`: `authenticatedRoute` ou permissão admin adequada
- [ ] Revisão system-design-specialist

---

## 4. Frontend — substituir dashboard por quote context (D-1, D-2, D-3)

- [ ] `fmz-token-purchase-api.ts`: adicionar `fetchTokenPurchaseQuoteContext({ propertyTokenizationId })` → `GET /tenant/token-purchases/quote/context`
- [ ] Tipos em `fmz-token-purchase.types.ts`: adicionar `FmzTokenPurchaseContext` e `FmzTokenPurchaseGoal`
- [ ] `FmzTenantTokenPurchasePages.tsx`:
  - Remover `useDashboardSeed` (hook e import de `getCurrentTenantDashboard`)
  - Substituir por `useQuoteContext` que faz o fetch do context endpoint
  - Remover `paymentMethod` das dependências do `useTokenPurchaseQuote`
  - Inicializar `quantity` com `context.rentProjectionInputs.currentTokenBalance` (ou `minQuantity` se zero)
  - Derivar `max` do slider de `context.availableSupply`
  - Remover `calculateImpactProjection` e o import (projeção vem de `rentImpact` da quote)
  - Exibir skeleton no slider e seção de impacto enquanto context carrega
- [ ] TypeScript sem erros (`npx tsc --noEmit`)

---

## 5. Frontend — exibir goals da cotação (D-4)

- [ ] `FmzTenantTokenPurchasePages.tsx`:
  - Ler `context.goals` para a pill de próxima meta e barra de progresso
  - Derivar `nextGoal = goals.find(g => g.targetTokenAmount > currentTokenBalance)` (já ordenado por `display_order`)
  - Derivar `tokensRemainingToNextGoal = nextGoal.targetTokenAmount - currentTokenBalance`
  - Substituir valores hardcoded (`nextGoalTokens = 10000`, `goalPct = 10`) pelos valores reais do goal

---

## 6. Frontend — admin view de conquistas (D-6)

- [ ] Investigar se `FmzAdminTenantSettings.tsx` já tem seção de goals (tem — create/edit)
- [ ] Adicionar seção "Conquistas registradas" na página de goals do admin:
  - Filtro por goal selecionada
  - Lista: nome do tenant, data de conquista, saldo na conquista
  - Busca via `GET /admin/tenant-settings/goals/achievements?propertyTokenizationId=...`

---

## 7. Teste end-to-end

- [ ] Página de compra carrega com 1 request (verificar Network tab)
- [ ] Trocar PIX/Boleto não faz request novo
- [ ] Slider começa em `currentTokenBalance`, termina em `availableSupply`
- [ ] Goals exibidas são as do banco (não hardcoded)
- [ ] Após compra que cruza um goal, `tenant_goal_achievements` tem o registro
- [ ] Admin vê conquista na listagem
