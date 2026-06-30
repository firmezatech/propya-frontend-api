# Token Purchase Page — Fast Path

**Data:** 2026-06-12
**Checklist de implementação:** `TOKEN_PURCHASE_PAGE_FAST_PATH_CHECKLIST.md`

---

## Contexto

A página `/connected/tokens-to-purchase-pix` tinha dois problemas de performance reportados:

1. **Cascata (waterfall):** carregava o dashboard do tenant (`GET /tenant/dashboard`) antes de iniciar a cotação — dois requests sequenciais onde o segundo só começa quando o primeiro termina.
2. **Re-fetch ao trocar método de pagamento:** `paymentMethod` (PIX/Boleto) era dependência do hook de cotação. Clicar em PIX→Boleto disparava um novo request desnecessário — os valores monetários são os mesmos para ambos.

---

## Investigação

### Por que o dashboard estava lá

`useDashboardSeed` foi adicionado antes do endpoint `/quote/context` existir. Ele era a única fonte de:
- `currentTokenBalance`, `totalSupply` (para a barra de disponibilidade)
- `currentRentAmount`, `adjustedBaseRentAmount` (para projeção de impacto)
- `nextGoalPercentage`, `nextGoalTokensRemaining` (para o pill de meta)

### O que o `/quote/context` já retorna

O endpoint `GET /tenant/token-purchases/quote/context` foi projetado exatamente para resolver o problema do slider — retorna os dados quantidade-independentes uma vez e o frontend projeta o restante localmente. Já inclui:

```js
{
  propertyTokenizationId, tokenSymbol, tokenName, currency,
  unitPrice, processingFeePercent,
  totalSupply, availableSupply, minQuantity, maxQuantity,
  rentProjectionInputs: {          // null se o tenant não tem contrato ativo
    currentTokenBalance,
    ownershipBps,
    currentOwnershipPercentage,
    baseRentAmount,
    adjustedBaseRentAmount,
    currentRentAmount,
  },
  issuedAt, expiresAt, expiresInSeconds,
}
```

Esses dados são **cacheados por 30s por `(userId, propertyTokenizationId)`** no backend. O primeiro request quente faz ~5 queries indexadas; subsequentes são zero-DB.

### O que falta no `/quote/context`

Goals (metas de posse) não estão incluídas. A tabela `token_system.tenant_ownership_goals` tem as metas criadas pelo admin para cada tokenização, mas não há campo de progresso/conquista por tenant nessa tabela — a lógica de "tenant atingiu a meta X" existe no código do settlement (`tokenSettlementInputs.js`) mas não é persistida.

### Estado atual do painel admin de goals

| Capacidade | Status |
|---|---|
| Admin cria goals por tokenização | ✅ `POST /admin/tenant-settings/goals` |
| Admin edita goals | ✅ `PATCH /admin/tenant-settings/goals/:goalId` |
| Admin lista goals | ✅ `GET /admin/tenant-settings?propertyTokenizationId=...` |
| Admin vê quais tenants atingiram cada goal | ❌ não existe |
| Admin deleta goal | ❌ não existe |
| Goals são retornadas ao tenant na cotação | ❌ não incluídas no `/quote/context` |
| Conquista de goal é persistida no banco | ❌ apenas calculada em runtime no settlement |

---

## Decisões

### D-1: Substituir `useDashboardSeed` por `useQuoteContext`

**Decisão:** remover `getCurrentTenantDashboard` da página de compra. Usar `GET /tenant/token-purchases/quote/context` como fonte única dos dados quantidade-independentes.

**Por quê:** o context endpoint já foi projetado para isso, é cacheado, e retorna exatamente os campos necessários. O dashboard era redundante desde que `rentImpact` foi adicionado ao quote.

**Alternativas descartadas:** manter o dashboard como fallback — adiciona complexidade sem benefício real; se o context falhar, o fluxo de compra não deve prosseguir de qualquer forma.

**Impacto técnico:** remover `useDashboardSeed`, `getCurrentTenantDashboard`, e `calculateImpactProjection` da página. Slider e projeções passam a depender exclusivamente do context endpoint.

### D-2: Remover `paymentMethod` do hook de cotação

**Decisão:** `paymentMethod` sai das dependências do `useEffect` de cotação. O método escolhido é estado local puro — só importa no POST de criação do pagamento.

**Por quê:** PIX e Boleto têm o mesmo preço e taxa. Re-fetching ao trocar método é latência pura sem valor.

**Impacto técnico:** `paymentMethod` deixa de ser enviado na query string do `/quote`. O backend aceita paymentMethod como opcional (ou ignorado para fins de pricing). Se o backend validar sua presença, remover essa validação.

### D-3: Slider inicializa com dados do context, não hardcoded

**Decisão:** o slider começa desabilitado até o context carregar (~200-400ms); ao receber o context, inicializa `quantity = currentTokenBalance` e `max = availableSupply`.

**Por quê:** o usuário vê sua posição atual como ponto de partida — faz sentido narrativo ("você tem X, quer comprar mais"). Não há segundo request; os dados chegam no mesmo context fetch.

**Fallback:** se `currentTokenBalance === 0`, inicializa em `minQuantity`.

### D-4: Goals vêm do banco, incluídas no `/quote/context`

**Decisão:** adicionar `goals: TenantOwnershipGoal[]` ao response de `/quote/context`. A lista já existe na tabela `tenant_ownership_goals` filtrada por `property_tokenization_id` e `is_active = true`.

**Por quê:** goals são exibidas na página de compra (pill de próxima meta, barra de progresso). Puxar em request separado seria uma terceira chamada; incluir no context é custo zero porque o context já carrega dados da tokenização.

**Impacto técnico:** `loadQuoteContext` no backend passa a buscar `fetchTenantOwnershipGoals(propertyTokenizationId)` em paralelo com o restante. O cache TTL de 30s cobre os goals também.

### D-5: Conquista de goals deve ser persistida

**Decisão:** quando o settlement de tokens concluir com sucesso, comparar o novo balance com cada goal ativa e inserir registros em `token_system.tenant_ownership_goal_achievements`.

**Por quê:** hoje a conquista é calculada em runtime no settlement mas descartada. O admin não tem visibilidade de quem atingiu o quê, e o tenant não tem histórico de conquistas. Persistência é o que transforma o cálculo em informação útil.

**Achado da investigação:** a tabela já existe no banco com schema completo (`goal_id, user_id, property_id, property_tokenization_id, token_balance_at_achievement, ownership_bps_at_achievement, achieved_at, metadata`) e unique index `(goal_id, user_id)`. Nenhuma migration necessária — só falta o código backend que escreva nela.

**Impacto técnico:** `insertGoalAchievement` e `listGoalAchievements` em `platformSettingsRepository.js`; lógica de check no `tokenSettlementFinalizer` (já tem acesso aos goals via `tokenSettlementInputs.js`). Inserção idempotente via `ON CONFLICT DO NOTHING`.

### D-6: Admin precisa de view de conquistas

**Decisão:** adicionar endpoint `GET /admin/tenant-settings/goals/achievements` e seção correspondente no painel admin.

**Por quê:** o admin cria as metas mas atualmente não consegue ver quem as atingiu — o ciclo de feedback está quebrado.

---

## Fluxo final da página após implementação

```
Mount
  └─ GET /quote/context   (cacheado 30s; retorna context + goals)
        ↓ ~300ms
     Inicializa slider: quantity = currentTokenBalance, max = availableSupply
     Exibe goals/pill de próxima meta
        ↓
     Usuário move slider
        ↓ (sem request)
     Projeção local de ownership % e aluguel estimado
        ↓
     Usuário clica "Confirmar" → POST /payments (inclui paymentMethod escolhido)
```

Requests por sessão na página de seleção: **1** (era 2 em cascata + re-fetch por método).
