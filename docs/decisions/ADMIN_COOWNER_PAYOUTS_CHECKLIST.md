# Checklist de Implementação — Admin: Pagamentos a Co-owners (PR-6)

**Decision docs:**
- Frontend: `ADMIN_COOWNER_PAYOUTS_UI.md`
- Backend: `propya-backend-api/docs/decisions/I_COOWNER_PAYOUT_REDISTRIBUTION.md` (D-7, D-8)
- Backlog backend: `propya-backend-api/docs/BACKLOG.md` (Seção PR), PR-1 a PR-5 ✅ 2026-06-19

---

## 1. Backend (propya-backend-api) — já concluído antes desta leva

- [x] `GET /admin/co-owner-payouts`, `POST /admin/payout-requests/:id/approve|reject`,
  `POST /admin/payout-requests/approve-batch` — implementados e testados
- [x] Permissões `admin.co_owner_payouts.view`/`.manage` + página
  `/connected/admin-co-owner-payouts` registradas via migration `202606190002`
- [x] `npm test` (backend) — 933/933

## 2. Frontend (este repo)

- [x] `docs/decisions/ADMIN_COOWNER_PAYOUTS_UI.md` — criado
- [x] `domain/fmz-admin-co-owner-payouts.types.ts` — tipos espelhando o contrato do GET/POSTs
- [x] `domain/fmz-admin-co-owner-payouts-grouping.ts` — `groupRowsByTransaction` (pura)
- [x] `domain/fmz-admin-co-owner-payouts-row-state.ts` — `deriveRowState` (D-2, pura)
- [x] `services/fmz-admin-co-owner-payouts-api.ts` — `listCoOwnerPayouts`, `approvePayoutRequest`,
  `rejectPayoutRequest`, `approvePayoutRequestsBatch`
- [x] `hooks/fmz-admin-co-owner-payouts.ts` — `useFmzAdminCoOwnerPayouts`
- [x] `components/FmzAdminCoOwnerPayoutsSummary.tsx` — KPI strip
- [x] `components/FmzAdminCoOwnerPayoutTransactionCard.tsx` — card por evento
- [x] `components/FmzAdminCoOwnerPayoutRow.tsx` — linha de co-owner + badge de estado (D-2)
- [x] `components/FmzAdminCoOwnerPayoutConfirmModal.tsx` — approve/reject/batch
- [x] `components/FmzAdminCoOwnerPayoutsList.tsx` — componente raiz
- [x] `src/app/[locale]/connected/admin-co-owner-payouts/page.tsx`
- [x] Testes de `groupRowsByTransaction` (4) e `deriveRowState` (6) em `src/__tests__/`
- [x] `npx tsc --noEmit` — 0 erros nos arquivos novos (12 erros pré-existentes em
  `register.test.ts`, confirmados não relacionados via `git stash`)
- [ ] `npm run lint` (`next lint`) — comando está quebrado no projeto independente desta feature
  (`Invalid project directory provided, no such directory: .../lint`, mesmo sem argumentos) —
  problema de ambiente pré-existente, fora do escopo desta entrega
- [ ] `npm run build` — não executado nesta sessão (ambiente sandbox sem variáveis de runtime
  completas; type-check + lint de tipos já cobrem a maior parte do risco)
- [x] `npm test` (Jest) — 17/18 suítes passando, 428/433 testes; a única suíte que falha
  (`register.test.ts`) já falhava antes desta mudança (campos `birthdate`/`cpf` removidos do tipo
  `RegisterFormData` em commit anterior, não relacionado)
- [x] Revisão system-design-specialist (hook automático) — achados corrigidos durante a escrita
  (import faltante, cast `as never` desnecessário); nenhum HIGH/CRITICAL real pendente
- [ ] Smoke test manual local (`npm run dev`) — não executado nesta sessão (requer backend local
  rodando com a migration `202606190002` aplicada); recomendado antes do deploy

## 3. Pendente / fora desta leva

- [ ] **Deploy do frontend** — a rota só fica acessível após deploy (depende também do deploy do
  backend com a migration `202606190002` já aplicada em produção, se ainda não estiver)
- [x] PR-7 (backend) — backfill da venda secundária já completada antes do PR-3 existir (concluído
  2026-06-21, ver `propya-backend-api/docs/COOWNER_PAYOUTS_CHECKLIST.md`)

## 4. Paridade com mockup `references/Admin - Repasses CoOwners.html` (2026-06-21)

Decisões: `ADMIN_COOWNER_PAYOUTS_UI.md`, seção "Paridade com o mockup" (D-8 a D-15).
Backend: `propya-backend-api/docs/decisions/I_COOWNER_PAYOUT_REDISTRIBUTION.md` D-12 (concluído,
`npm test` 940/940).

### Backend (concluído nesta sessão, repo `propya-backend-api`)

- [x] `adminCoOwnerPayoutsRepository.js` — `rent_charge_id`, query batch de `rent_charges`,
  `token_orders.user_id/quantity/unit_price`
- [x] `adminCoOwnerPayoutsPresenter.js` — `tenantName`/`rentTotalBrl`/`tokenQuantity`/`tokenUnitValueBrl`
- [x] Testes do presenter (6 novos casos, incluindo null-safety)

### Frontend (este repo)

- [x] `domain/fmz-admin-co-owner-payouts.types.ts` — 4 campos novos em `FmzCoOwnerPayoutRow` +
  `propertyTokenizationId` em `FmzCoOwnerPayoutsFilters`
- [x] `services/fmz-admin-co-owner-payouts-api.ts` — `normalizeRow` mapeia os 4 campos +
  `listCoOwnerPayouts` envia `propertyTokenizationId`
- [x] `domain/fmz-admin-co-owner-payouts-grouping.ts` — `FmzCoOwnerPayoutTransaction` carrega os 4
  campos novos (do primeiro row, mesmo padrão de `cycleLabel`/`eventDate`)
- [x] `domain/fmz-admin-co-owner-payouts-transaction-status.ts` (novo) — `deriveTransactionStatus`,
  `countEligiblePending`, `sumTransactionTotalBrl` (puras, testadas)
- [x] `domain/fmz-admin-co-owner-payouts-avatar.ts` (novo) — `deriveInitials`, `deriveAvatarColor`
  (puras, testadas)
- [x] `hooks/fmz-admin-co-owner-payouts.ts` — generaliza `approveSelected` → `approveEligible(ids?)`
  (D-14); `availableProperties` derivado de `rows` (D-12)
- [x] `components/FmzAdminCoOwnerPayoutsSummary.tsx` — layout vertical ícone-no-topo (D-15)
- [x] `components/FmzAdminCoOwnerPayoutsList.tsx` — filtros de imóvel/tipo (tipo client-side, D-13)
  + botão global "Processar N PIX elegíveis" (D-12/D-14); `pendingBatchIds` unifica os 3 gatilhos
  de lote (seleção, rodapé do card, botão global) num único modal de confirmação
- [x] `components/FmzAdminCoOwnerPayoutTransactionCard.tsx` — colapsável, avatar, badges, infobar,
  nota de bloqueados, rodapé "Aprovar N elegíveis" (D-8/D-9/D-10/D-14) — pede confirmação ao
  caller, nunca aprova direto (D-4)
- [x] `components/FmzAdminCoOwnerPayoutRow.tsx` → `<tr>` de tabela (D-11), mantendo Aprovar/Rejeitar
  + 4 estados adicionais de ação (below_minimum/eligible/processing/rejected) com `title` tooltip
- [x] Testes novos: `deriveTransactionStatus`/`countEligiblePending`/`sumTransactionTotalBrl` (8),
  `deriveInitials`/`deriveAvatarColor` (7); `groupRowsByTransaction` estendido (+1, total 5)
- [x] `npx tsc --noEmit` — 0 erros novos (erros pré-existentes em `register.test.ts`, não
  relacionados, já documentados antes desta leva)
- [x] `npx jest` — 19/20 suítes, 442/447 testes (a 1 suíte que falha é a mesma pré-existente)
- [x] `npx next build` — exit code 0, todas as rotas compiladas, incluindo
  `/[locale]/connected/admin-co-owner-payouts`
- [x] Checklist atualizado (esta leva, 2026-06-21)

**Aproximação assumida, documentada:** a coluna "Saldo acumulado" da tabela usa
`accruedBalanceBrl` (saldo total corrente do co-owner) — o mockup mostra um valor "carregado de
antes deste evento", que não existe como campo granular separado no backend atual. Não bloqueia a
entrega; registrado aqui para uma eventual revisão futura se o produto precisar da distinção.
