/**
 * Tests: Admin Co-owner Payouts — grouping (D-1)
 *
 * groupRowsByTransaction agrupa as linhas flat retornadas pelo backend em cards
 * por evento de origem (sourceType + sourceReferenceId) — 1 card = N co-owners.
 */

import { groupRowsByTransaction } from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts-grouping';
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
  readyForPayout: true,
  payoutRequest: null,
  tenantName: 'Diana Aguilar',
  rentTotalBrl: '2800.00',
  tokenQuantity: null,
  tokenUnitValueBrl: null,
  ...overrides,
});

describe('groupRowsByTransaction', () => {
  it('returns an empty array for an empty input', () => {
    expect(groupRowsByTransaction([])).toEqual([]);
  });

  it('groups rows with the same (sourceType, sourceReferenceId) into one card', () => {
    const rows = [
      buildRow({ ownerUserId: 'owner-1' }),
      buildRow({ ownerUserId: 'owner-2' }),
    ];

    const result = groupRowsByTransaction(rows);

    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe('rent_distribution');
    expect(result[0].sourceReferenceId).toBe('run-1');
    expect(result[0].rows).toHaveLength(2);
    expect(result[0].rows.map((r) => r.ownerUserId)).toEqual(['owner-1', 'owner-2']);
  });

  it('carries tenantName/rentTotalBrl/tokenQuantity/tokenUnitValueBrl from the first row (D-12)', () => {
    const rows = [
      buildRow({ sourceType: 'token_sale', sourceReferenceId: 'order-1', tenantName: 'Jorge Nunes', rentTotalBrl: null, tokenQuantity: 67, tokenUnitValueBrl: '100.00' }),
      buildRow({ sourceType: 'token_sale', sourceReferenceId: 'order-1', ownerUserId: 'owner-2' }),
    ];

    const result = groupRowsByTransaction(rows);

    expect(result[0].tenantName).toBe('Jorge Nunes');
    expect(result[0].rentTotalBrl).toBeNull();
    expect(result[0].tokenQuantity).toBe(67);
    expect(result[0].tokenUnitValueBrl).toBe('100.00');
  });

  it('keeps rent_distribution and token_sale events in separate cards even for the same owner', () => {
    const rows = [
      buildRow({ sourceType: 'rent_distribution', sourceReferenceId: 'run-1' }),
      buildRow({ sourceType: 'token_sale', sourceReferenceId: 'order-1', cycleLabel: null }),
    ];

    const result = groupRowsByTransaction(rows);

    expect(result).toHaveLength(2);
    expect(result.map((card) => card.sourceType)).toEqual(['rent_distribution', 'token_sale']);
  });

  it('preserves first-appearance order of each transaction key', () => {
    const rows = [
      buildRow({ sourceReferenceId: 'run-2', ownerUserId: 'owner-a' }),
      buildRow({ sourceReferenceId: 'run-1', ownerUserId: 'owner-b' }),
      buildRow({ sourceReferenceId: 'run-2', ownerUserId: 'owner-c' }),
    ];

    const result = groupRowsByTransaction(rows);

    expect(result.map((card) => card.sourceReferenceId)).toEqual(['run-2', 'run-1']);
    expect(result[0].rows.map((r) => r.ownerUserId)).toEqual(['owner-a', 'owner-c']);
  });
});
