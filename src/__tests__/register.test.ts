/**
 * Tests: Registration — validation utilities and API contract
 *
 * Scope:
 *   - maskCpf         — display mask correctness
 *   - maskBirthdate   — display mask correctness
 *   - validateCpf     — Brazilian check-digit algorithm
 *   - birthdateBRToISO — DD/MM/AAAA → YYYY-MM-DD conversion
 *   - isAdultBirthdate — 18+ age check
 *   - computePasswordStrength — 0–4 score
 *   - isValidFullName  — two-word requirement
 *   - validateStep1   — step-level error map
 *   - validateStep2   — step-level error map
 *   - hasErrors       — error presence check
 *
 * Assertion conventions (consistent with existing project tests):
 *   - `expect(value).toBe(...)` / `expect(value).toEqual(...)` for equality
 *   - `expect(value).toBeTruthy()` / `expect(value).toBeFalsy()` for boolean
 *   - `expect(obj).toMatchObject({})` for partial object matching
 *   - No jest-dom; pure logic tests only
 */

import {
  birthdateBRToISO,
  computePasswordStrength,
  hasErrors,
  isAdultBirthdate,
  isValidFullName,
  maskBirthdate,
  maskCpf,
  parseBirthdateBR,
  validateCpf,
  validateStep1,
  validateStep2,
} from '../features/auth-access/register/register.validation';
import type { RegisterFormData } from '../features/auth-access/register/register.types';

// ─── maskCpf ──────────────────────────────────────────────────────────────────

describe('maskCpf', () => {

  it('returns digits as-is when fewer than 4 characters', () => {
    expect(maskCpf('123')).toBe('123');
  });

  it('adds first dot after 3 digits', () => {
    expect(maskCpf('1234')).toBe('123.4');
  });

  it('adds second dot after 6 digits', () => {
    expect(maskCpf('1234567')).toBe('123.456.7');
  });

  it('adds hyphen after 9 digits', () => {
    expect(maskCpf('1234567890')).toBe('123.456.789-0');
  });

  it('formats 11 digits as full masked CPF', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01');
  });

  it('silently discards digits beyond 11', () => {
    expect(maskCpf('123456789012345')).toBe('123.456.789-01');
  });

  it('strips non-digit characters before masking', () => {
    expect(maskCpf('123.456.789-01')).toBe('123.456.789-01');
  });

  it('returns empty string for empty input', () => {
    expect(maskCpf('')).toBe('');
  });

});

// ─── maskBirthdate ────────────────────────────────────────────────────────────

describe('maskBirthdate', () => {

  it('returns digits as-is when fewer than 3 characters', () => {
    expect(maskBirthdate('31')).toBe('31');
  });

  it('adds first slash after 2 digits', () => {
    expect(maskBirthdate('311')).toBe('31/1');
  });

  it('adds second slash after 4 digits', () => {
    expect(maskBirthdate('31121')).toBe('31/12/1');
  });

  it('formats 8 digits as full masked birthdate', () => {
    expect(maskBirthdate('31121990')).toBe('31/12/1990');
  });

  it('silently discards digits beyond 8', () => {
    expect(maskBirthdate('3112199099')).toBe('31/12/1990');
  });

  it('strips non-digit characters before masking', () => {
    expect(maskBirthdate('31/12/1990')).toBe('31/12/1990');
  });

  it('returns empty string for empty input', () => {
    expect(maskBirthdate('')).toBe('');
  });

});

// ─── validateCpf ──────────────────────────────────────────────────────────────

describe('validateCpf', () => {

  it('validates a correct CPF without mask', () => {
    // Known valid CPF (generated for testing only)
    expect(validateCpf('52998224725')).toBe(true);
  });

  it('validates a correct CPF with mask', () => {
    expect(validateCpf('529.982.247-25')).toBe(true);
  });

  it('rejects a CPF with wrong check digits', () => {
    expect(validateCpf('52998224726')).toBe(false);
  });

  it('rejects all-zeros CPF', () => {
    expect(validateCpf('00000000000')).toBe(false);
  });

  it('rejects all-ones CPF', () => {
    expect(validateCpf('11111111111')).toBe(false);
  });

  it('rejects all-nines CPF', () => {
    expect(validateCpf('99999999999')).toBe(false);
  });

  it('rejects CPF shorter than 11 digits', () => {
    expect(validateCpf('1234567890')).toBe(false);
  });

  it('rejects CPF longer than 11 digits (no mask)', () => {
    expect(validateCpf('529982247250')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateCpf('')).toBe(false);
  });

  it('rejects CPF that is all the same digit (e.g. 555)', () => {
    expect(validateCpf('55555555555')).toBe(false);
  });

});

// ─── parseBirthdateBR ─────────────────────────────────────────────────────────

describe('parseBirthdateBR', () => {

  it('returns a Date for a valid DD/MM/YYYY string', () => {
    const parsed = parseBirthdateBR('15/03/2000');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2000);
    expect(parsed?.getMonth()).toBe(2); // March = index 2
    expect(parsed?.getDate()).toBe(15);
  });

  it('returns null for an impossible date (31/02/2000)', () => {
    expect(parseBirthdateBR('31/02/2000')).toBeNull();
  });

  it('returns null for wrong format', () => {
    expect(parseBirthdateBR('2000-03-15')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseBirthdateBR('')).toBeNull();
  });

});

// ─── birthdateBRToISO ────────────────────────────────────────────────────────

describe('birthdateBRToISO', () => {

  it('converts a valid DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(birthdateBRToISO('15/03/2000')).toBe('2000-03-15');
  });

  it('pads single-digit months and days', () => {
    expect(birthdateBRToISO('05/01/1995')).toBe('1995-01-05');
  });

  it('returns empty string for an invalid date', () => {
    expect(birthdateBRToISO('31/02/2000')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(birthdateBRToISO('')).toBe('');
  });

});

// ─── isAdultBirthdate ────────────────────────────────────────────────────────

describe('isAdultBirthdate', () => {

  it('returns true for a birthdate exactly 18 years ago', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    expect(isAdultBirthdate(`${day}/${month}/${year}`)).toBe(true);
  });

  it('returns false for a birthdate 17 years ago', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 17);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    expect(isAdultBirthdate(`${day}/${month}/${year}`)).toBe(false);
  });

  it('returns true for a birthdate 50 years ago', () => {
    expect(isAdultBirthdate('15/03/1975')).toBe(true);
  });

  it('returns false for an invalid birthdate', () => {
    expect(isAdultBirthdate('not-a-date')).toBe(false);
  });

});

// ─── computePasswordStrength ─────────────────────────────────────────────────

describe('computePasswordStrength', () => {

  it('returns 0 for empty string', () => {
    expect(computePasswordStrength('')).toBe(0);
  });

  it('returns 1 for password with only length criterion (≥ 8 chars)', () => {
    expect(computePasswordStrength('abcdefgh')).toBe(1);
  });

  it('returns 2 for password with length + uppercase', () => {
    expect(computePasswordStrength('Abcdefgh')).toBe(2);
  });

  it('returns 3 for password with length + uppercase + digit', () => {
    expect(computePasswordStrength('Abcdefg1')).toBe(3);
  });

  it('returns 4 for password satisfying all criteria', () => {
    expect(computePasswordStrength('Abcdef1!')).toBe(4);
  });

  it('returns 0 for password shorter than 8 with no other criteria', () => {
    expect(computePasswordStrength('abc')).toBe(0);
  });

  it('counts special characters from the expected set', () => {
    // 'aaaaaaa!' has 8 chars (length ✓) and a special char (✓) → score 2
    expect(computePasswordStrength('aaaaaaa!')).toBe(2);
    // 'aaa!' has 4 chars (length ✗) and a special char (✓) → score 1
    expect(computePasswordStrength('aaa!')).toBe(1);
  });

});

// ─── isValidFullName ─────────────────────────────────────────────────────────

describe('isValidFullName', () => {

  it('returns true for a two-word name', () => {
    expect(isValidFullName('João Silva')).toBe(true);
  });

  it('returns true for a three-word name', () => {
    expect(isValidFullName('João da Silva')).toBe(true);
  });

  it('returns false for a single word', () => {
    expect(isValidFullName('João')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidFullName('')).toBe(false);
  });

  it('trims surrounding whitespace before testing', () => {
    expect(isValidFullName('  João Silva  ')).toBe(true);
  });

  it('returns false for whitespace-only string', () => {
    expect(isValidFullName('   ')).toBe(false);
  });

});

// ─── validateStep1 ───────────────────────────────────────────────────────────

const validStep1: Parameters<typeof validateStep1>[0] = {
  accountType: 'tenant',
  email: 'user@example.com',
  password: 'Secure1!',
  passwordConfirmation: 'Secure1!',
  phone: '+5511912345678',
  acceptedTerms: true,
  acceptedPrivacyPolicy: true,
};

describe('validateStep1', () => {

  it('returns empty errors for valid data', () => {
    expect(validateStep1(validStep1)).toEqual({});
  });

  it('requires accountType', () => {
    const result = validateStep1({ ...validStep1, accountType: '' as 'tenant' });
    expect(result.accountType).toBeTruthy();
  });

  it('requires email', () => {
    const result = validateStep1({ ...validStep1, email: '' });
    expect(result.email).toBeTruthy();
  });

  it('rejects malformed email', () => {
    const result = validateStep1({ ...validStep1, email: 'not-an-email' });
    expect(result.email).toBeTruthy();
  });

  it('requires password of at least 8 characters', () => {
    const result = validateStep1({ ...validStep1, password: 'abc' });
    expect(result.password).toBeTruthy();
  });

  it('rejects mismatched passwordConfirmation', () => {
    const result = validateStep1({ ...validStep1, passwordConfirmation: 'different' });
    expect(result.passwordConfirmation).toBeTruthy();
  });

  it('requires phone', () => {
    const result = validateStep1({ ...validStep1, phone: '' });
    expect(result.phone).toBeTruthy();
  });

  it('requires both terms to be accepted', () => {
    const result = validateStep1({ ...validStep1, acceptedTerms: false });
    expect(result.terms).toBeTruthy();
  });

  it('requires privacy policy to be accepted', () => {
    const result = validateStep1({ ...validStep1, acceptedPrivacyPolicy: false });
    expect(result.terms).toBeTruthy();
  });

  it('returns errors for multiple invalid fields simultaneously', () => {
    const result = validateStep1({
      ...validStep1,
      email: '',
      phone: '',
    });
    expect(result.email).toBeTruthy();
    expect(result.phone).toBeTruthy();
  });

});

// ─── validateStep2 ───────────────────────────────────────────────────────────

const validStep2: Parameters<typeof validateStep2>[0] = {
  fullName: 'João Silva',
  birthdate: '15/03/1990',
  cpf: '529.982.247-25',
};

describe('validateStep2', () => {

  it('returns empty errors for valid data', () => {
    expect(validateStep2(validStep2)).toEqual({});
  });

  it('requires fullName', () => {
    const result = validateStep2({ ...validStep2, fullName: '' });
    expect(result.fullName).toBeTruthy();
  });

  it('rejects single-word full name', () => {
    const result = validateStep2({ ...validStep2, fullName: 'João' });
    expect(result.fullName).toBeTruthy();
  });

  it('requires birthdate', () => {
    const result = validateStep2({ ...validStep2, birthdate: '' });
    expect(result.birthdate).toBeTruthy();
  });

  it('rejects invalid birthdate format', () => {
    const result = validateStep2({ ...validStep2, birthdate: '2000-03-15' });
    expect(result.birthdate).toBeTruthy();
  });

  it('rejects birthdate of a minor (under 18)', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 17);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const result = validateStep2({ ...validStep2, birthdate: `${day}/${month}/${year}` });
    expect(result.birthdate).toBeTruthy();
  });

  it('requires cpf', () => {
    const result = validateStep2({ ...validStep2, cpf: '' });
    expect(result.cpf).toBeTruthy();
  });

  it('rejects invalid CPF', () => {
    const result = validateStep2({ ...validStep2, cpf: '000.000.000-00' });
    expect(result.cpf).toBeTruthy();
  });

});

// ─── hasErrors ───────────────────────────────────────────────────────────────

describe('hasErrors', () => {

  it('returns false for an empty object', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns false when all values are undefined', () => {
    expect(hasErrors({ email: undefined, password: undefined })).toBe(false);
  });

  it('returns true when at least one value is a non-empty string', () => {
    expect(hasErrors({ email: 'E-mail inválido.', password: undefined })).toBe(true);
  });

  it('returns true when all values are strings', () => {
    expect(hasErrors({ email: 'err', password: 'err' })).toBe(true);
  });

});

// ─── RegisterFormData — type completeness (compile-time only) ──────────────

// This test does nothing at runtime — its purpose is to verify that the type
// can be fully constructed from its declared keys without TypeScript errors.
// If a required key is missing from register.types.ts, this block will fail
// the type-check step (`npx tsc --noEmit`).
describe('RegisterFormData type guard', () => {
  it('accepts a fully constructed form data object', () => {
    const data: RegisterFormData = {
      accountType: 'investor',
      email: 'test@example.com',
      password: 'Password1!',
      passwordConfirmation: 'Password1!',
      phone: '+5511912345678',
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      fullName: 'Test User',
      birthdate: '01/01/1990',
      cpf: '529.982.247-25',
    };

    expect(data.accountType).toBe('investor');
    expect(data.acceptedTerms).toBe(true);
  });
});
