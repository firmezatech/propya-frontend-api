/**
 * Tests: Admin Co-owner Payouts — avatar helpers (D-9)
 */

import {
  deriveAvatarColor,
  deriveInitials,
} from '../features/admin-co-owner-payouts/domain/fmz-admin-co-owner-payouts-avatar';

describe('deriveInitials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(deriveInitials('Jardim Aurora')).toBe('JA');
    expect(deriveInitials('Roberto Ferreira Silva')).toBe('RS');
  });

  it('uses the first two letters of a single word', () => {
    expect(deriveInitials('Aurora')).toBe('AU');
  });

  it('returns a dash for empty/null/undefined input', () => {
    expect(deriveInitials('')).toBe('—');
    expect(deriveInitials(null)).toBe('—');
    expect(deriveInitials(undefined)).toBe('—');
  });
});

describe('deriveAvatarColor', () => {
  it('is deterministic for the same seed', () => {
    expect(deriveAvatarColor('tok-1')).toBe(deriveAvatarColor('tok-1'));
  });

  it('returns a value from the fixed palette regardless of seed', () => {
    const color = deriveAvatarColor('any-seed-value');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('handles a null/empty seed without throwing', () => {
    expect(() => deriveAvatarColor(null)).not.toThrow();
    expect(() => deriveAvatarColor('')).not.toThrow();
  });
});
