/**
 * Tests: Admin Co-owner Payouts — row state derivation (D-2)
 */

import { deriveRowState } from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts-row-state';
import type { FmzCoOwnerPayoutRow } from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts.types';

const buildRow = (overrides: Partial<FmzCoOwnerPayoutRow> = {}): FmzCoOwnerPayoutRow => ({
  sourceType: 'rent_distribution',
  sourceReferenceId: 'run-1',
  property: { id: 'prop-1', tokenizationId: 'tok-1', name: 'Edifício Aurora', neighborhood: 'Pinheiros' },
  cycleLabel: '06/2026',
  eventDate: '2026-06-05T00:00:00.000Z',
  ownerUserId: 'owner-1',
  ownerName: 'Ana Silva',
  tokensBefore: 500,
  tokensAfter: 500,
  ownershipPctBefore: '0.5',
  ownershipPctAfter: '0.5',
  rentShareBrl: '480.00',
  tokenSaleShareBrl: '0',
  accruedBalanceBrl: '480.00',
  readyForPayout: false,
  payoutRequest: null,
  tenantName: 'Diana Aguilar',
  rentTotalBrl: '2800.00',
  tokenQuantity: null,
  tokenUnitValueBrl: null,
  ...overrides,
});

describe('deriveRowState', () => {
  it('returns below_minimum when not ready and no request', () => {
    expect(deriveRowState(buildRow({ readyForPayout: false, payoutRequest: null }))).toBe('below_minimum');
  });

  it('returns eligible when ready for payout but no request yet', () => {
    expect(deriveRowState(buildRow({ readyForPayout: true, payoutRequest: null }))).toBe('eligible');
  });

  it.each([
    ['pending_approval', 'pending_approval'],
    ['approved', 'processing'],
    ['paid', 'paid'],
    ['rejected', 'rejected'],
  ] as const)('returns %s for payoutRequest.status=%s', (status, expected) => {
    const row = buildRow({ readyForPayout: true, payoutRequest: { id: 'req-1', status } });
    expect(deriveRowState(row)).toBe(expected);
  });
});
