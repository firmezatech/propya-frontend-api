# Decisões de Design — Página Admin: Verificação de Identidade (KYC)

**Data:** 2026-06-11
**Status:** Design fechado — pronto para implementação
**Feature folder:** `src/features/admin-kyc/`
**Referência visual:** `references/firmeza_verificacao_identidade.html`
**Decision doc de backend:** `propya-backend-api/docs/decisions/ADMIN_KYC_IDENTITY_VERIFICATION.md`

---

## Contexto

Página admin de observabilidade do KYC. O admin **não aprova nem nega** verificações — isso é exclusivo do Didit via webhook. A única ação disponível é **liberar um usuário negado para tentar a verificação novamente**.

Os botões "Aprovar" e "Negar" presentes na referência visual foram removidos do escopo.

---

## Endpoints de backend

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/kyc/users` | Lista usuários com KYC info + summary strip |
| `POST` | `/admin/kyc/users/:userId/release` | Libera usuário para nova tentativa |

Query params do `GET`: `search`, `propertyId`, `propertyFilter`, `status`, `cursor`, `limit=25`.

---

## Infraestrutura a criar

### Tipos (`domain/fmz-admin-kyc.types.ts`)

```ts
export type FmzKycStatus = 'pending' | 'in_review' | 'verified' | 'declined';
export type FmzKycDisplayStatus = FmzKycStatus | 'released';

export type FmzKycDocumentType =
  | 'rg' | 'cnh' | 'passaporte' | 'selfie' | 'comprovante_residencia' | 'cpf';

export interface FmzAdminKycUser {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  registeredAt: string;
  kycStatus: FmzKycStatus;
  releasedForResubmission: boolean;
  lastSessionAt: string | null;
  attemptCount: number;
  diditDecision: { status: string; warnings: string[] } | null;
  property: { id: string; address: string } | null;
  documents: FmzKycDocumentType[];
}

export interface FmzKycSummary {
  pendingCount: number;
  inReviewCount: number;
  approvedCount: number;
  declinedCount: number;
}

export interface FmzAdminKycListResponse {
  summary: FmzKycSummary;
  users: FmzAdminKycUser[];
  nextCursor: string | null;
  total: number;
}
```

### API service (`services/fmz-admin-kyc-api.ts`)

```ts
listAdminKycUsers(filters: FmzKycListFilters): Promise<FmzAdminKycListResponse>
releaseKyc(userId: string): Promise<void>
```

---

## Decisões de UI

### D-1: Botões "Aprovar" e "Negar" removidos — única ação é "Liberar para nova tentativa"

**Decisão:** A referência visual mostra botões de aprovar e negar. Eles não serão implementados. O único botão de ação é "Liberar para nova tentativa", exibido apenas para usuários com `kycStatus = 'declined'`.

**Por quê:** Aprovação e negação são responsabilidade do Didit. O admin dar override manual contornaria a verificação biométrica, comprometendo o compliance.

---

### D-2: Status "released" é derivado no frontend

O backend retorna `kycStatus: 'declined'` + `releasedForResubmission: true`. O frontend mapeia isso para o display status `'released'` localmente.

```ts
function resolveDisplayStatus(user: FmzAdminKycUser): FmzKycDisplayStatus {
  if (user.kycStatus === 'declined' && user.releasedForResubmission) return 'released';
  return user.kycStatus;
}
```

---

### D-3: Ações por status

| Status (display) | Ação disponível |
|---|---|
| `pending` | Nenhuma — aguardando o usuário iniciar |
| `in_review` | Nenhuma — Didit processando |
| `verified` | Nenhuma — texto "Verificado via Didit em {data}" |
| `declined` | Botão "Liberar para nova tentativa" |
| `released` | Tag "Aguardando nova tentativa do usuário" |

---

### D-4: Motivos de negação vêm do Didit

Os warnings exibidos no card expandido são de `diditDecision.warnings` retornado pela API. O frontend mantém um mapa de tradução de código → texto amigável em português.

```ts
const DIDIT_WARNING_LABELS: Record<string, string> = {
  IMAGE_TOO_BLURRY:    'Imagem com baixa qualidade',
  LOW_FACE_QUALITY:    'Qualidade do rosto insuficiente',
  DOCUMENT_EXPIRED:    'Documento vencido',
  LIVENESS_FACE_ATTACK:'Ataque de apresentação detectado',
  // ...
};
```

Warnings não mapeados são exibidos como código bruto (não traduzidos) — melhor que suprimir.

---

### D-5: Modal de liberação é simples — sem campos

O modal de "Liberar para nova tentativa" só confirma a ação. Sem textarea de motivo ou checkboxes. O admin só precisa confirmar "sim, quero dar outra chance a este usuário".

---

### D-6: Busca com debounce de 300ms

Campo de busca (nome ou e-mail) usa debounce para evitar chamadas a cada tecla.

---

### D-7: Paginação por scroll infinito com fallback de botão

Ao rolar até o fim da lista, carrega o próximo cursor automaticamente. Botão "Carregar mais" aparece como fallback.

---

### D-8: Atualização local após liberação (sem reload da lista)

Após `releaseKyc()` retornar com sucesso, o card do usuário atualiza localmente para `releasedForResubmission: true` (display status → `released`) sem refazer o fetch da lista inteira.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `AdminKycPage.tsx` | Página completa: orquestra estado, filtros, lista e modal |
| `AdminKycSummaryStrip.tsx` | 4 cards de contagem (pendente, em análise, aprovado, negado) |
| `AdminKycFilterBar.tsx` | Busca + select de imóvel + status pills |
| `AdminKycUserCard.tsx` | Card accordion com detalhe expandível e botão de liberação |
| `AdminKycReleaseModal.tsx` | Modal de confirmação de liberação para nova tentativa |

---

## Dependências

| Item | Status |
|---|---|
| Endpoints backend (`/admin/kyc/users` e `/release`) | ⏳ backend a implementar primeiro |
| Mapa de tradução de warnings Didit | ⏳ criar junto com `AdminKycUserCard` |
