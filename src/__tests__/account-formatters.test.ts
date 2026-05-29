/**
 * Tests: fmz-account-formatters — account page formatting utilities
 *
 * Scope:
 *   - normalizeBirthdateForForm  — ISO → DD/MM/YYYY, passthrough, fallback
 *   - formatCepInput             — CEP masking with hyphen at position 5
 *   - maskCpf                    — CPF display masking (keeps middle 3 segments)
 *   - formatWalletNumber         — walletNumber → formatted address
 *   - formatWalletSub            — tokenBalance + ownershipPercentage subtitle
 *   - getPasswordStrength        — 0-4 score with label and barKey
 *   - resolvePasswordBarClass    — cssModule lookup with fallback
 *   - sanitizeUserForForm        — transforms UserType into AccountPageUser form state
 */

import {
  formatCepInput,
  formatWalletNumber,
  formatWalletSub,
  getPasswordStrength,
  maskCpf,
  normalizeBirthdateForForm,
  resolvePasswordBarClass,
  sanitizeUserForForm,
} from '../features/account/domain/fmz-account-formatters';
import type { AccountPageUser } from '../features/account/domain/fmz-account-page.types';
import type { UserType } from '../features/account/domain/fmz-user.types';

// ─── normalizeBirthdateForForm ────────────────────────────────────────────────

describe('normalizeBirthdateForForm', () => {

  it('converts ISO date YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(normalizeBirthdateForForm('1990-12-31')).toBe('31/12/1990');
  });

  it('passes through an already-formatted DD/MM/YYYY date', () => {
    expect(normalizeBirthdateForForm('31/12/1990')).toBe('31/12/1990');
  });

  it('returns empty string for null', () => {
    expect(normalizeBirthdateForForm(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeBirthdateForForm(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeBirthdateForForm('')).toBe('');
  });

  it('uses ISO extraction when datetime includes time component', () => {
    expect(normalizeBirthdateForForm('2000-06-15T00:00:00.000Z')).toBe('15/06/2000');
  });

});

// ─── formatCepInput ───────────────────────────────────────────────────────────

describe('formatCepInput', () => {

  it('returns digits as-is when fewer than 6 characters', () => {
    expect(formatCepInput('01310')).toBe('01310');
  });

  it('inserts hyphen after the 5th digit', () => {
    expect(formatCepInput('01310100')).toBe('01310-100');
  });

  it('strips non-digit characters before masking', () => {
    expect(formatCepInput('01310-100')).toBe('01310-100');
  });

  it('truncates to 8 digits silently', () => {
    expect(formatCepInput('013101009999')).toBe('01310-100');
  });

  it('returns empty string for empty input', () => {
    expect(formatCepInput('')).toBe('');
  });

});

// ─── maskCpf ──────────────────────────────────────────────────────────────────

describe('maskCpf', () => {

  it('masks 11 raw digits as ***.xxx.xxx-**', () => {
    expect(maskCpf('52998224725')).toBe('***.982.247-**');
  });

  it('masks CPF with formatting characters', () => {
    expect(maskCpf('529.982.247-25')).toBe('***.982.247-**');
  });

  it('returns the generic mask for fewer than 11 digits', () => {
    expect(maskCpf('12345')).toBe('***.***.***-**');
  });

  it('returns the generic mask for null', () => {
    expect(maskCpf(null)).toBe('***.***.***-**');
  });

  it('returns the generic mask for undefined', () => {
    expect(maskCpf(undefined)).toBe('***.***.***-**');
  });

  it('returns the generic mask for empty string', () => {
    expect(maskCpf('')).toBe('***.***.***-**');
  });

});

// ─── formatWalletNumber ───────────────────────────────────────────────────────

describe('formatWalletNumber', () => {

  it('returns walletNumber directly when provided', () => {
    const user = { walletNumber: 'W-0001' } as AccountPageUser;
    expect(formatWalletNumber(user)).toBe('W-0001');
  });

  it('abbreviates wallet address when walletNumber is absent', () => {
    const user = { wallet: '0xABCDEF1234567890' } as AccountPageUser;
    expect(formatWalletNumber(user)).toBe('0xABCD...7890');
  });

  it('returns fallback text when neither walletNumber nor wallet is set', () => {
    const user = {} as AccountPageUser;
    expect(formatWalletNumber(user)).toBe('Carteira não informada');
  });

});

// ─── formatWalletSub ──────────────────────────────────────────────────────────

describe('formatWalletSub', () => {

  it('includes tokenBalance and ownershipPercentage when both are set', () => {
    const user = { tokenBalance: 10, ownershipPercentage: '2.5' } as AccountPageUser;
    expect(formatWalletSub(user)).toBe('10 tokens · 2.5% do imóvel');
  });

  it('uses fallback text when tokenBalance is absent', () => {
    const user = { ownershipPercentage: '2.5' } as AccountPageUser;
    expect(formatWalletSub(user)).toBe('Tokens vinculados à conta · 2.5% do imóvel');
  });

  it('uses fallback text when ownershipPercentage is absent', () => {
    const user = { tokenBalance: 5 } as AccountPageUser;
    expect(formatWalletSub(user)).toBe('5 tokens · participação conforme contrato');
  });

  it('uses both fallbacks when neither field is set', () => {
    const user = {} as AccountPageUser;
    expect(formatWalletSub(user)).toBe('Tokens vinculados à conta · participação conforme contrato');
  });

});

// ─── getPasswordStrength ──────────────────────────────────────────────────────

describe('getPasswordStrength', () => {

  it('returns score 0 and passwordBar key for empty string', () => {
    const result = getPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.barKey).toBe('passwordBar');
    expect(result.label).toBeTruthy();
  });

  it('returns score 1 and passwordBarWeak for only-length criterion', () => {
    const result = getPasswordStrength('abcdefgh');
    expect(result.score).toBe(1);
    expect(result.barKey).toBe('passwordBarWeak');
  });

  it('returns score 2 and passwordBarOk for length + uppercase', () => {
    const result = getPasswordStrength('Abcdefgh');
    expect(result.score).toBe(2);
    expect(result.barKey).toBe('passwordBarOk');
    expect(result.label).toBe('Razoável');
  });

  it('returns score 3 and passwordBarOk for length + uppercase + digit', () => {
    const result = getPasswordStrength('Abcdefg1');
    expect(result.score).toBe(3);
    expect(result.barKey).toBe('passwordBarOk');
    expect(result.label).toBe('Boa');
  });

  it('returns score 4 and passwordBarStrong for all criteria', () => {
    const result = getPasswordStrength('Abcdef1!');
    expect(result.score).toBe(4);
    expect(result.barKey).toBe('passwordBarStrong');
    expect(result.label).toBe('Forte');
  });

  it('returns score 0 for a password shorter than 8 with no other criteria', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBe(0);
  });

});

// ─── resolvePasswordBarClass ──────────────────────────────────────────────────

describe('resolvePasswordBarClass', () => {

  const cssModule = {
    passwordBar: 'bar',
    passwordBarWeak: 'bar-weak',
    passwordBarOk: 'bar-ok',
    passwordBarStrong: 'bar-strong',
  };

  it('returns the correct CSS class for a known barKey', () => {
    expect(resolvePasswordBarClass('passwordBarStrong', cssModule)).toBe('bar-strong');
  });

  it('returns empty string for an unknown barKey', () => {
    expect(resolvePasswordBarClass('unknownKey' as never, {})).toBe('');
  });

});

// ─── sanitizeUserForForm ──────────────────────────────────────────────────────

describe('sanitizeUserForForm', () => {

  const base: UserType = {
    name: 'João Silva',
    email: 'joao@example.com',
    birthdate: '1990-03-15',
    postalCode: '01310100',
    country: 'BR',
  };

  it('normalizes ISO birthdate to DD/MM/YYYY', () => {
    const result = sanitizeUserForForm(base);
    expect(result.birthdate).toBe('15/03/1990');
  });

  it('formats postalCode with hyphen', () => {
    const result = sanitizeUserForForm(base);
    expect(result.postalCode).toBe('01310-100');
  });

  it('defaults country to BR when not provided', () => {
    const result = sanitizeUserForForm({ ...base, country: undefined });
    expect(result.country).toBe('BR');
  });

  it('preserves country when provided', () => {
    const result = sanitizeUserForForm({ ...base, country: 'US' });
    expect(result.country).toBe('US');
  });

  it('initializes password fields to empty strings', () => {
    const result = sanitizeUserForForm(base);
    expect(result.currentPassword).toBe('');
    expect(result.newPassword).toBe('');
    expect(result.confirmPassword).toBe('');
  });

  it('returns empty postalCode string when postalCode is absent', () => {
    const result = sanitizeUserForForm({ ...base, postalCode: undefined });
    expect(result.postalCode).toBe('');
  });

});
