import type { FmzCoOwnerPayoutRow } from './fmz-admin-co-owner-payouts.types';

// ─── Card por evento de origem (D-1) ──────────────────────────────────────────────
// 1 card = 1 (sourceType, sourceReferenceId) = N linhas de co-owner. O backend
// deliberadamente nunca agrega além do summary (ver doc de backend D-7) — o
// agrupamento por evento é responsabilidade do frontend.

export type FmzCoOwnerPayoutTransaction = {
  sourceType: FmzCoOwnerPayoutRow['sourceType'];
  sourceReferenceId: string;
  property: FmzCoOwnerPayoutRow['property'];
  cycleLabel: string | null;
  eventDate: string;
  // Idênticos em toda linha do mesmo evento (D-12 do doc de backend) — copiados da primeira
  // linha vista, mesmo padrão de cycleLabel/eventDate acima.
  tenantName: string | null;
  rentTotalBrl: string | null;
  tokenQuantity: number | null;
  tokenUnitValueBrl: string | null;
  rows: FmzCoOwnerPayoutRow[];
};

const transactionKeyOf = (row: FmzCoOwnerPayoutRow): string =>
  `${row.sourceType}:${row.sourceReferenceId}`;

/**
 * Agrupa linhas flat em cards por evento de origem, preservando a ordem de
 * primeira aparição de cada evento (estável para a UI não "saltar" entre renders).
 *
 * Time:  O(n) — uma passagem pelas linhas.
 * Space: O(n) — um Map com até n entradas.
 */
export function groupRowsByTransaction(
  rows: FmzCoOwnerPayoutRow[],
): FmzCoOwnerPayoutTransaction[] {
  const byKey = new Map<string, FmzCoOwnerPayoutTransaction>();

  for (const row of rows) {
    const key = transactionKeyOf(row);
    const existing = byKey.get(key);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    byKey.set(key, {
      sourceType: row.sourceType,
      sourceReferenceId: row.sourceReferenceId,
      property: row.property,
      cycleLabel: row.cycleLabel,
      eventDate: row.eventDate,
      tenantName: row.tenantName,
      rentTotalBrl: row.rentTotalBrl,
      tokenQuantity: row.tokenQuantity,
      tokenUnitValueBrl: row.tokenUnitValueBrl,
      rows: [row],
    });
  }

  return [...byKey.values()];
}
