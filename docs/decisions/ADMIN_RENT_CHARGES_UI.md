# Decisões de Design — Página Admin: Boletos de Aluguel

**Data:** 2026-06-11  
**Status:** Em implementação  
**Feature folder:** `src/features/admin-rent-charges/`  
**Referência visual:** `references/firmeza_boleto_validacao.html`  
**Decision doc de backend:** `propya-backend-api/docs/decisions/ADMIN_RENT_CHARGE_VALIDATION.md`

---

## Contexto

A validação de boletos de aluguel pelo admin passa por um fluxo de revisão e ajuste manual
antes de enviar ao Asaas. O backend já tem toda a lógica (service + controller + webhook).
Esta página é o ponto de entrada do admin para esse fluxo.

---

## Endpoints de backend

| Método  | Rota                                           | Descrição                                      |
|---------|------------------------------------------------|------------------------------------------------|
| `GET`   | `/admin/rent-charges?competenceMonth=YYYY-MM-01` | Lista cobranças com filtros + summary strip  |
| `PATCH` | `/admin/rent-charges/:id/adjust`               | Ajuste manual dos 4 campos editáveis           |
| `POST`  | `/admin/rent-charges/:id/validate`             | Valida + envia ao Asaas (pending→open)         |

O `GET` lista com filtros opcionais: `propertyId`, `status` (`pending_validation | open | paid`).

---

## Infraestrutura já pronta (NÃO reconstruir)

- **Tipos:** `src/features/admin-rent-charges/domain/fmz-admin-rent-charges.types.ts` — completo
- **API service:** `src/features/admin-rent-charges/services/fmz-admin-rent-charges-api.ts` — completo
  - `listAdminRentCharges(filters)` → `FmzAdminRentChargeListResponse`
  - `adjustAdminRentCharge(id, payload)` → `FmzRentChargeAdjustResponse`
  - `validateAdminRentCharge(id)` → `void`

---

## Decisões de UI

### D-1: Filtro de competência obrigatório

O campo `competenceMonth` é obrigatório na API. A página inicializa com o mês atual
(`YYYY-MM-01` no formato America/Sao_Paulo) e permite navegar entre meses via seletor.

### D-2: Summary strip no topo

Acima da lista: 3 cards de resumo (`pendingCount`, `doneCount`, `totalPendingVolumeBrl`).
Atualiza junto com o filtro.

### D-3: Listagem com estado inline de edição

Cada linha da tabela tem um modo de visualização e um modo de edição inline.
O admin pode editar os 4 campos (`tokenPurchase`, `discountedRent`, `platformAdminFee`,
`tokenPurchaseFee`) diretamente na linha antes de validar.

### D-4: Coluna "ajustado" com diff visual

Quando `hasManualAdjustment = true`, exibe badge "Ajustado" e mostra o diff entre
`amounts` (original) e `calculatedAmounts` (atual após ajuste).

### D-5: Botão "Validar" com confirm modal

Validar envia ao Asaas e muda o status para `open`. Ação irreversível → modal de confirmação
antes de chamar `validateAdminRentCharge`. Após sucesso, recarrega a lista.

### D-6: Filtro por status

Dropdown: "Todos", "Pendente validação", "Em aberto", "Pago". Valor padrão: "Pendente validação"
(foco na fila de trabalho do admin).

### D-7: Tratamento de erros inline

Erros da API aparecem como toast no topo + campo com erro em vermelho no modo de edição.
Não navegar para página de erro — o admin precisa continuar trabalhando na lista.

---

## Estrutura de arquivos a criar

```
src/features/admin-rent-charges/
  components/
    FmzAdminRentChargesList.tsx      ← componente principal (list + filtros + summary)
    FmzAdminRentChargeRow.tsx        ← linha individual (visualização + edição inline)
    FmzAdminRentChargeSummary.tsx    ← strip de 3 cards de summary
    index.ts
  hooks/
    fmz-admin-rent-charges.ts        ← hook de estado (filtros, loading, lista, edição)

src/app/[locale]/connected/
  admin-rent-charges/
    page.tsx                         ← page Next.js (server component + guard de role admin)
```

---

> **Checklist de implementação:** mantido centralmente em
> `propya-backend-api/docs/REMOVE_BLOCKCHAIN_CHECKLIST.md` — seção "Frontend — Página admin de boletos de aluguel".

---

## Padrão de componente admin (referência)

Seguir o mesmo padrão de `FmzAdminPropertiesManagement.tsx`:
- `'use client'` no componente principal
- Tipos de view mode: `'list' | 'detail'` ou similar
- Toast: `{ message: string; ok: boolean } | null`
- Prefixo `Fmz` + PascalCase em todos os componentes
- Usar `fmzCn` para classes condicionais
- `FmzFormAlert` para erros de API
- Componentes de layout do barrel: `FmzAdminListSkeleton`
