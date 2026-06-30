# Decisões de Design — Página Admin: Pagamentos a Co-owners

**Data:** 2026-06-19
**Status:** Em implementação
**Feature folder:** `src/features/admin-co-owner-payouts/`
**Decision doc de backend:** `propya-backend-api/docs/decisions/I_COOWNER_PAYOUT_REDISTRIBUTION.md` (D-7, D-8)

---

## Contexto

O backend já credita os co-owners por aluguel (TWAO) e por venda de tokens no mercado secundário,
e tem um fluxo de aprovação manual de PIX (`payout_mode='manual'`): o job cria pedidos
(`owner_payout_requests`) que ficam pendentes até um admin aprovar ou rejeitar. Esta página é o
ponto de entrada do admin para esse fluxo — ver saldo/elegibilidade por co-owner e disparar (ou
rejeitar) o PIX.

> Nota: este documento substitui a referência original
> `propya-frontend-api/docs/decisions/ADMIN_COOWNER_PAYOUTS_UI.md` citada pelo doc de backend como
> já existente em 2026-06-18 — na prática ela nunca foi criada neste repo. Este é o documento
> definitivo; o backend já foi implementado assumindo o contrato descrito em D-7/D-8 de
> `I_COOWNER_PAYOUT_REDISTRIBUTION.md`, que é o que se segue abaixo.

---

## Endpoints de backend

| Método | Rota                                                      | Descrição                                   |
|--------|-----------------------------------------------------------|----------------------------------------------|
| `GET`  | `/admin/co-owner-payouts?competenceMonth=YYYY-MM-01&status=` | Lista linhas (1 por co-owner por evento) + summary |
| `POST` | `/admin/payout-requests/:id/approve`                       | Aprova → dispara PIX via Asaas               |
| `POST` | `/admin/payout-requests/:id/reject`                        | Rejeita (body opcional `{ reason }`)         |
| `POST` | `/admin/payout-requests/approve-batch`                     | Aprova em lote (body `{ ids: string[] }`)    |

O `GET` retorna `rows[]` **flat** — uma linha por co-owner por evento de origem (`sourceType` +
`sourceReferenceId`), nunca agregada no backend além do `summary`. `competenceMonth` é
obrigatório; `status` filtra por `payoutRequest.status` (linhas sem pedido são excluídas quando
um status é passado).

---

## Decisões de UI

### D-1 — Cards por evento, não tabela flat

A página agrupa `rows` por `${sourceType}:${sourceReferenceId}` em "transaction cards" — 1 card =
1 `distribution_run` (aluguel) ou 1 `token_order` (venda de tokens) = N co-owners. Cada card
mostra o cabeçalho do evento (imóvel + ciclo, ou "Venda de tokens" + data) e a lista de co-owners
daquele evento como sub-linhas. Agrupamento feito no frontend (`groupRowsByTransaction`, pura,
testada) — o backend deliberadamente não agrega além do `summary` (D-7 do doc de backend).

### D-2 — Seis estados de linha

| Estado | Condição | Badge |
|---|---|---|
| Abaixo do mínimo | `!readyForPayout && !payoutRequest` | cinza |
| Elegível, sem pedido ainda | `readyForPayout && !payoutRequest` | azul |
| Aguardando aprovação | `payoutRequest.status === 'pending_approval'` | âmbar |
| Em processamento | `payoutRequest.status === 'approved'` (raro/transitório — só existe se um PIX ficou em voo no momento exato da claim) | roxo |
| Pago | `payoutRequest.status === 'paid'` | verde |
| Rejeitado | `payoutRequest.status === 'rejected'` | vermelho |

O admin precisa ver os 6, não só a fila de aprovação — "abaixo do mínimo" e "elegível sem pedido"
informam o que está por vir.

### D-3 — Filtros: `competenceMonth` (obrigatório) + `status` (opcional, default "Todos")

Mês de competência inicia no mês atual (`YYYY-MM-01`, fuso América/São_Paulo). Diferente de
`admin-rent-charges`, o filtro de status **não** tem default restritivo — começa em "Todos" para
não esconder "abaixo do mínimo"/"elegível sem pedido" por padrão. Sem filtro de
`propertyTokenizationId` nesta entrega (a API aceita, mas não há seletor de propriedades já
integrado nesta tela — adicionar depois não quebra o contrato).

### D-4 — Aprovar/rejeitar sempre via modal de confirmação

Aprovar dispara um PIX real — nunca um clique direto. Modal de aprovação (estilo primário/verde):
mostra co-owner + valor + "isto envia um PIX real via Asaas". Modal de rejeição (estilo
destrutivo, clonando `FmzDeleteConfirmModal`): textarea opcional para motivo.

### D-5 — Seleção em lote (`approve-batch`)

Checkbox por linha **apenas** em estado "aguardando aprovação" (as únicas que podem ser
aprovadas). Barra de ação fixa aparece quando há seleção (contagem + soma em BRL), com 1 modal de
confirmação antes de chamar `approve-batch`. Resultado por item (`results[]`) é mostrado em
toasts/alertas individuais quando algum item falha — sucesso parcial não é tratado como erro
geral.

### D-6 — Refetch completo após mutação (sem optimistic update)

Approve/reject/approve-batch sempre recarregam a lista inteira após sucesso (mesmo padrão de
`validateCharge` em `admin-rent-charges`) — o saldo/estado de outras linhas do mesmo accrual pode
ter mudado.

### D-7 — KPI strip com os 5 números do `summary`

4-5 cards no topo: saldo pendente total, co-owners aguardando, transações abertas, abaixo do
mínimo (+ valor). Mesmo padrão visual de `FmzAdminRentChargeSummary`/`FmzAdminTokenOrdersList`.

---

## Paridade com o mockup `references/Admin - Repasses CoOwners.html` (2026-06-21)

> A entrega original (D-1..D-7) foi construída direto do contrato de backend, sem reconciliar com
> o mockup HTML estático que já existia em `references/`. A usuária identificou a divergência
> (estrutura, não só estilo) e decidiu o escopo do rebuild: replicar visual/estrutura do mockup,
> **mantendo** rejeitar + seleção em lote (ausentes no mockup, mas já em produção). Decisão de
> backend correspondente: `propya-backend-api/docs/decisions/I_COOWNER_PAYOUT_REDISTRIBUTION.md`
> D-12 (novos campos `tenantName`/`rentTotalBrl`/`tokenQuantity`/`tokenUnitValueBrl`, sem migration).

### D-8 — Cards de transação ficam colapsáveis

Cada card abre/fecha ao clicar no header (estado local `isOpen` em
`FmzAdminCoOwnerPayoutTransactionCard`, não elevado ao hook — não precisa sobreviver a um refetch).
O primeiro card da lista renderizada começa aberto (`defaultOpen={index === 0}`, passado pelo
`FmzAdminCoOwnerPayoutsList`); os demais começam fechados. Chevron rotaciona via classe condicional
(`rotate-180`), sem biblioteca de animação.

### D-9 — Header do card ganha total, badge de tipo e badge de status da transação

- **Total**: soma de `rentShareBrl + tokenSaleShareBrl` de todas as linhas do card — calculado no
  frontend (`sumTransactionTotalBrl`, pura), nunca pedido ao backend (mesmo princípio de D-7 do
  doc de backend: o backend não agrega além do `summary`).
- **Badge de tipo** ("Ciclo Mensal"/"Compra Avulsa"): deriva direto de `transaction.sourceType` —
  não é um campo novo, é só uma label de UI para `rent_distribution`/`token_sale`.
- **Badge de status da transação** ("Pendente"/"Parcial"/"Processado"): novo helper puro
  `deriveTransactionStatus(transaction)` — mirror do `getTxStatus` do mockup, mas usando os 6
  estados de linha já existentes (D-2) em vez de só `aprovado`/não-aprovado: uma linha conta como
  "aprovada" se `payoutRequest.status` for `approved`, `paid` (qualquer estado que não seja mais
  `pending_approval`/`eligible`/`below_minimum`).
- **Avatar colorido com iniciais do imóvel**: helper puro `deriveInitials(name)` +
  `deriveAvatarColor(seed)` (hash determinístico do `tokenizationId` → paleta fixa de 6 cores) —
  evita logo genérico, replica o efeito visual do mockup sem precisar de imagem.

### D-10 — Infobar usa os campos novos do backend (D-12), com fallback "—"

Para `rent_distribution`: Inquilina = `tenantName`, Aluguel pago = `rentTotalBrl` (formatado BRL).
Para `token_sale`: Inquilina = `tenantName` (o comprador), Compra de tokens =
`${tokenQuantity} tokens × ${tokenUnitValueBrl}`. O campo que não se aplica ao `sourceType` da
transação sai como `"—"` — nunca um erro, mesmo padrão de `tokensBefore`/`tokensAfter` nulos (D-10
do doc de backend). Total movimentado = mesmo cálculo de D-9.

### D-11 — Tabela de co-owners substitui a lista de linhas simples

`FmzAdminCoOwnerPayoutRow` passa a renderizar `<tr>` dentro de uma `<table>` (não mais `<div>`
flex), com colunas: checkbox (mantido, D-5) + nome, Tokens (antes→depois, `"—"` se `null` — só
`rent_distribution` tem o dado, D-10 do backend), % Posse (antes/depois/delta, mesma regra de
null), Do aluguel (`rentShareBrl` ou `"—"` se `'0'`), Da venda de tokens (`tokenSaleShareBrl` ou
`"—"` se `'0'`), Saldo acumulado (chip), Total PIX (soma das duas colunas anteriores), Status
(badge dos 6 estados, D-2 inalterado), Ação. **Diferente do mockup**: a coluna Ação mantém o par
"Aprovar"/"Rejeitar" (D-4) em vez de só "Aprovar PIX" — decisão explícita da usuária de manter o
fluxo de rejeição já em produção.

### D-12 — Filtro de imóvel: derivado das linhas já carregadas, sem nova chamada de API

O mockup tem um seletor de imóvel com a lista completa de propriedades. Em vez de buscar todas as
propriedades cadastradas (que pode incluir imóveis sem nenhuma transação no mês de competência
selecionado — opções vazias, ruído), as opções vêm de `rows` já carregadas: `Set` de
`{tokenizationId, name}` distintos, memoizado. `propertyTokenizationId` é então passado para
`listCoOwnerPayouts` (o backend já aceita esse parâmetro desde a entrega original — D-3) — ao
trocar de imóvel, a lista é refeita via API, não filtrada em memória (evita inconsistência entre
"imóveis disponíveis" e "imóvel selecionado" depois de um refetch por outro filtro).

### D-13 — Filtro de tipo (Ciclo Mensal/Compra Avulsa): 100% client-side

`sourceType` já vem em toda linha — filtrar por tipo não precisa de parâmetro de API novo. Vive
como estado local em `FmzAdminCoOwnerPayoutsList` (não no hook, não persiste em `filters` da API),
aplicado sobre `hook.transactions` depois do agrupamento.

### D-14 — Dois pontos de entrada para aprovação em lote, mesma ação no hook

O mockup tem 2 botões de lote que o fluxo atual (seleção por checkbox) não tinha: um por
transação ("Aprovar N PIX elegíveis" no rodapé do card) e um global no header da página
("Processar N PIX elegíveis"). Generalizamos `approveSelected` (que só lia
`selectedRequestIds`) para `approveEligible(ids?: string[])` — se `ids` for passado, aprova
exatamente essa lista (usado pelos botões de card/header, que computam os ids elegíveis daquele
escopo); se omitido, usa `selectedRequestIds` (comportamento antigo, usado pela barra fixa de
seleção, D-5, mantida). Um único caminho de código para os 3 gatilhos de lote — sem 3 implementações
divergentes de "aprovar vários".

### D-15 — KPI strip: layout vertical (ícone no topo, valor abaixo), não horizontal

O mockup usa cards com o ícone colorido no topo e o valor grande abaixo (mais "dashboard", menos
"linha de lista"). Reescrevemos `SummaryCard` para esse layout — raio maior (`rounded-[13px]`),
ícone 34×34, valor em `text-[23px]`. Mantém as mesmas 4 métricas do `summary` (D-7 inalterado no
contrato, só a apresentação visual muda).

---

## Infraestrutura já pronta no backend (NÃO reconstruir)

- `GET /admin/co-owner-payouts`, `POST /admin/payout-requests/:id/approve|reject`,
  `POST /admin/payout-requests/approve-batch` — implementados, testados (933/933 testes JS no
  backend), permissões `admin.co_owner_payouts.view`/`.manage` e página
  `/connected/admin-co-owner-payouts` já registradas via migration.

---

## Estrutura de arquivos a criar

```
src/features/admin-co-owner-payouts/
  domain/
    fmz-admin-co-owner-payouts.types.ts
    fmz-admin-co-owner-payouts-grouping.ts   ← groupRowsByTransaction (pura, testada)
    index.ts
  services/
    fmz-admin-co-owner-payouts-api.ts
  hooks/
    fmz-admin-co-owner-payouts.ts
  components/
    FmzAdminCoOwnerPayoutsSummary.tsx
    FmzAdminCoOwnerPayoutTransactionCard.tsx
    FmzAdminCoOwnerPayoutRow.tsx
    FmzAdminCoOwnerPayoutConfirmModal.tsx
    FmzAdminCoOwnerPayoutsList.tsx
    index.ts

src/app/[locale]/connected/admin-co-owner-payouts/
  page.tsx
```

> **Checklist de implementação:** `docs/decisions/ADMIN_COOWNER_PAYOUTS_CHECKLIST.md`

---

## Padrão de componente admin (referência)

Mesmo padrão de `src/features/admin-rent-charges/`:
- `'use client'` no componente principal e nos componentes interativos
- Toast local `{ message: string; ok: boolean } | null`
- Prefixo `Fmz` + PascalCase
- `fmzCn` para classes condicionais
- `FmzFormAlert` para erros de API, `FmzAdminListSkeleton` para loading
- Hook sem SWR/React Query — `useState`/`useEffect`/`useCallback` + `fetchGenerationRef`
