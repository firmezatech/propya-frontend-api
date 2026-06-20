import type { FmzCoOwnerPayoutRow } from './fmz-admin-co-owner-payouts.types';

// ─── Seis estados de linha (D-2) ──────────────────────────────────────────────
// 'processing' (payoutRequest.status === 'approved') é transitório/raro — só
// existe se um PIX ficou "em voo" no momento exato da claim — mas precisa de um
// estado próprio para nunca renderizar sem estilo se aparecer.

export type FmzAdminCoOwnerPayoutRowState =
  | 'below_minimum'
  | 'eligible'
  | 'pending_approval'
  | 'processing'
  | 'paid'
  | 'rejected';

/**
 * Deriva o estado visual de uma linha a partir de readyForPayout + payoutRequest.
 *
 * Time:  O(1). Space: O(1).
 */
export function deriveRowState(row: FmzCoOwnerPayoutRow): FmzAdminCoOwnerPayoutRowState {
  switch (row.payoutRequest?.status) {
    case 'pending_approval':
      return 'pending_approval';
    case 'approved':
      return 'processing';
    case 'paid':
      return 'paid';
    case 'rejected':
      return 'rejected';
    default:
      return row.readyForPayout ? 'eligible' : 'below_minimum';
  }
}
