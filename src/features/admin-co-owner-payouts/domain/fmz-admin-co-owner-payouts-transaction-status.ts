import { deriveRowState } from './fmz-admin-co-owner-payouts-row-state';
import type { FmzCoOwnerPayoutTransaction } from './fmz-admin-co-owner-payouts-grouping';

// ─── Status agregado do card de transação (mockup de referência, D-9) ──────────────
// Deriva dos 6 estados de linha já existentes (D-2) — nunca um campo novo do backend,
// que deliberadamente não agrega além do summary (D-7 do doc de backend).

export type FmzAdminCoOwnerPayoutTransactionStatus = 'pending' | 'partial' | 'done';

const APPROVED_STATES = new Set(['processing', 'paid']);
const ACTIONABLE_STATES = new Set(['eligible', 'pending_approval']);

/**
 * Time:  O(n) — uma passagem pelas linhas do card.
 * Space: O(1).
 */
export function deriveTransactionStatus(
  transaction: FmzCoOwnerPayoutTransaction,
): FmzAdminCoOwnerPayoutTransactionStatus {
  let approvedCount = 0;
  let actionableCount = 0;

  for (const row of transaction.rows) {
    const state = deriveRowState(row);
    if (APPROVED_STATES.has(state)) approvedCount += 1;
    else if (ACTIONABLE_STATES.has(state)) actionableCount += 1;
  }

  if (approvedCount > 0 && actionableCount === 0) return 'done';
  if (approvedCount > 0) return 'partial';
  return 'pending';
}

/** Linhas elegíveis e ainda sem ação (estado 'eligible' ou 'pending_approval'). */
export function countEligiblePending(transaction: FmzCoOwnerPayoutTransaction): number {
  return transaction.rows.filter((row) => ACTIONABLE_STATES.has(deriveRowState(row))).length;
}

function parseBrl(value: string): number {
  if (!value) return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Soma rentShareBrl + tokenSaleShareBrl de todas as linhas — o backend nunca agrega isso. */
export function sumTransactionTotalBrl(transaction: FmzCoOwnerPayoutTransaction): number {
  return transaction.rows.reduce(
    (sum, row) => sum + parseBrl(row.rentShareBrl) + parseBrl(row.tokenSaleShareBrl),
    0,
  );
}
