/**
 * Tests: Admin Co-owner Payouts — transaction status / aggregate helpers (D-9)
 */

import {
  countEligiblePending,
  deriveTransactionStatus,
  sumTransactionTotalBrl,
} from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts-transaction-status';
import type { FmzCoOwnerPayoutTransaction } from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts-grouping';
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

const buildTransaction = (rows: FmzCoOwnerPayoutRow[]): FmzCoOwnerPayoutTransaction => ({
  sourceType: rows[0].sourceType,
  sourceReferenceId: rows[0].sourceReferenceId,
  property: rows[0].property,
  cycleLabel: rows[0].cycleLabel,
  eventDate: rows[0].eventDate,
  tenantName: rows[0].tenantName,
  rentTotalBrl: rows[0].rentTotalBrl,
  tokenQuantity: rows[0].tokenQuantity,
  tokenUnitValueBrl: rows[0].tokenUnitValueBrl,
  rows,
});

describe('deriveTransactionStatus', () => {
  it('returns pending when no row is approved yet', () => {
    const tx = buildTransaction([
      buildRow({ readyForPayout: true, payoutRequest: null }),
      buildRow({ readyForPayout: false, payoutRequest: null }),
    ]);
    expect(deriveTransactionStatus(tx)).toBe('pending');
  });

  it('returns partial when some eligible rows are approved and others still need action', () => {
    const tx = buildTransaction([
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-1', status: 'paid' } }),
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-2', status: 'pending_approval' } }),
    ]);
    expect(deriveTransactionStatus(tx)).toBe('partial');
  });

  it('returns done when every eligible row is approved/paid', () => {
    const tx = buildTransaction([
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-1', status: 'paid' } }),
      buildRow({ readyForPayout: false, payoutRequest: null }), // below_minimum não bloqueia "done"
    ]);
    expect(deriveTransactionStatus(tx)).toBe('done');
  });

  it('a rejected row counts neither as approved nor actionable', () => {
    const tx = buildTransaction([
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-1', status: 'rejected' } }),
    ]);
    expect(deriveTransactionStatus(tx)).toBe('pending');
  });
});

describe('countEligiblePending', () => {
  it('counts only eligible/pending_approval rows', () => {
    const tx = buildTransaction([
      buildRow({ readyForPayout: true, payoutRequest: null }), // eligible
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-1', status: 'pending_approval' } }),
      buildRow({ readyForPayout: true, payoutRequest: { id: 'req-2', status: 'paid' } }),
      buildRow({ readyForPayout: false, payoutRequest: null }), // below_minimum
    ]);
    expect(countEligiblePending(tx)).toBe(2);
  });
});

describe('sumTransactionTotalBrl', () => {
  it('sums rentShareBrl + tokenSaleShareBrl across all rows', () => {
    const tx = buildTransaction([
      buildRow({ rentShareBrl: '480,00', tokenSaleShareBrl: '0' }),
      buildRow({ rentShareBrl: '0', tokenSaleShareBrl: '120,50' }),
    ]);
    expect(sumTransactionTotalBrl(tx)).toBeCloseTo(600.5, 2);
  });

  it('returns 0 for an empty/garbage value', () => {
    const tx = buildTransaction([buildRow({ rentShareBrl: '', tokenSaleShareBrl: 'abc' })]);
    expect(sumTransactionTotalBrl(tx)).toBe(0);
  });
});
