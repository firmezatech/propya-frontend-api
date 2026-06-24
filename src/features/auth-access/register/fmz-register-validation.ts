/**
 * Registration form — pure validation and mask utilities.
 *
 * All functions are stateless and side-effect-free, making them trivially
 * unit-testable. No React, no DOM, no axios.
 *
 * Responsibilities:
 *   - Input masks (CPF, birthdate)
 *   - CPF check-digit validation (Brazilian algorithm)
 *   - Password strength scoring (0–4)
 *   - Field-level validation for each step
 *   - Cross-step error presence check
 */

import { getFmzPhoneCountry, isValidFmzPhoneNumber, type FmzPhoneCountryCode } from '../../../lib/fmz-phone-country-format';
import type { RegisterFormData, RegisterStep1Errors, RegisterStep2Errors } from './fmz-register.types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum age in years required to register. */
const MINIMUM_REGISTRATION_AGE = 18;

/** Digits-only CPF string (no mask) has exactly 11 characters. */
const CPF_DIGIT_LENGTH = 11;

const BIRTHDATE_PATTERN = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_PATTERN = /^[^\s].*\s+.*[^\s]$/;

/** Password strength metadata indexed by score (0 = no input, 1–4 = progressive). */
export const PASSWORD_STRENGTH_LABELS: readonly string[] = [
  '',
  'Fraca',
  'Razoável',
  'Boa',
  'Forte',
];

export const PASSWORD_STRENGTH_COLORS: readonly string[] = [
  'transparent',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
];

// ─── Mask helpers ─────────────────────────────────────────────────────────────

/**
 * Applies CPF display mask to a raw string.
 * Input digits beyond 11 are silently discarded.
 *
 * Examples:
 *   '12345678901' → '123.456.789-01'
 *   '123'         → '123'
 *   '1234'        → '123.4'
 */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, CPF_DIGIT_LENGTH);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Applies DD/MM/AAAA birthdate display mask to a raw string.
 * Input digits beyond 8 are silently discarded.
 *
 * Examples:
 *   '31121990' → '31/12/1990'
 *   '31'       → '31'
 *   '311'      → '31/1'
 */
export function maskBirthdate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ─── CPF validation ───────────────────────────────────────────────────────────

/**
 * Validates a CPF string (with or without mask) using the Brazilian
 * check-digit algorithm.
 *
 * Algorithm: O(n), two-pass weighted sum.
 *   Pass 1 — verifies 10th digit against the first 9 digits.
 *   Pass 2 — verifies 11th digit against the first 10 digits.
 *
 * Time:  O(n) where n = 11 (constant in practice)
 * Space: O(1)
 */
export function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== CPF_DIGIT_LENGTH) return false;

  // Reject sequences of identical digits ('000...', '111...', etc.) — all pass
  // the arithmetic but are not valid CPFs.
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const computeCheckDigit = (slice: string): number => {
    const weight = slice.length + 1;
    const sum = slice
      .split('')
      .reduce((acc, digit, index) => acc + Number(digit) * (weight - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  const first = computeCheckDigit(digits.slice(0, 9));
  if (first !== Number(digits[9])) return false;

  const second = computeCheckDigit(digits.slice(0, 10));
  return second === Number(digits[10]);
}

// ─── Birthdate helpers ────────────────────────────────────────────────────────

/**
 * Parses a DD/MM/AAAA string into a Date, returning null for invalid inputs.
 * Validates calendar coherence (e.g. 31/02/2000 → null).
 */
export function parseBirthdateBR(birthdate: string): Date | null {
  if (!BIRTHDATE_PATTERN.test(birthdate)) return null;

  const [day, month, year] = birthdate.split('/').map(Number);
  const parsed = new Date(year, month - 1, day);

  const isCoherent =
    parsed.getDate() === day &&
    parsed.getMonth() === month - 1 &&
    parsed.getFullYear() === year;

  return isCoherent ? parsed : null;
}

/**
 * Converts a valid DD/MM/AAAA birthdate string to ISO format YYYY-MM-DD.
 * Returns an empty string for invalid inputs (caller must validate first).
 */
export function birthdateBRToISO(birthdate: string): string {
  const parsed = parseBirthdateBR(birthdate);
  if (!parsed) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns true when the birthdate represents a person aged at least
 * MINIMUM_REGISTRATION_AGE years on today's date.
 */
export function isAdultBirthdate(birthdate: string): boolean {
  const parsed = parseBirthdateBR(birthdate);
  if (!parsed) return false;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MINIMUM_REGISTRATION_AGE);
  cutoff.setHours(23, 59, 59, 999);

  return parsed <= cutoff;
}

// ─── Password strength ────────────────────────────────────────────────────────

/**
 * Password strength score based on four independent criteria.
 * Score is additive: each satisfied criterion adds 1 point.
 *
 * Criteria:
 *   1. length ≥ 8
 *   2. contains an uppercase letter
 *   3. contains a digit
 *   4. contains a special character (!@#$%^&*...)
 *
 * Returns 0 when the password is empty, 1–4 otherwise.
 *
 * Time:  O(n) — single pass per regex test (four tests, each O(n))
 * Space: O(1)
 */
export function computePasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

  return score;
}

// ─── Name validation ──────────────────────────────────────────────────────────

/**
 * Requires at least two words separated by whitespace.
 * Trims surrounding whitespace before testing.
 */
export function isValidFullName(name: string): boolean {
  return FULL_NAME_PATTERN.test(name.trim());
}

// ─── Step validators ──────────────────────────────────────────────────────────

/**
 * Validates all Step 1 fields and returns a map of field → error message.
 * An empty object means the step is valid.
 */
export function validateStep1(data: Pick<RegisterFormData,
  'accountType' | 'email' | 'password' | 'passwordConfirmation' | 'acceptedTerms' | 'acceptedPrivacyPolicy'
>): RegisterStep1Errors {
  const errors: RegisterStep1Errors = {};

  if ('accountType' in data && !data.accountType) {
    errors.accountType = 'Selecione o tipo de conta.';
  }

  if (!data.email.trim()) {
    errors.email = 'O e-mail é obrigatório.';
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = 'Formato de e-mail inválido.';
  }

  if (!data.password) {
    errors.password = 'A senha é obrigatória.';
  } else if (data.password.length < 8) {
    errors.password = 'A senha deve ter ao menos 8 caracteres.';
  }

  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = 'Confirme a sua senha.';
  } else if (data.password !== data.passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas não conferem.';
  }

  if (!data.acceptedTerms || !data.acceptedPrivacyPolicy) {
    errors.terms = 'Aceite os termos e a política de privacidade para continuar.';
  }

  return errors;
}

/** Only countries the masking lib knows (BR/US/PT) get a digit-count check. */
const hasNationalMask = (countryCode: string): countryCode is FmzPhoneCountryCode =>
  getFmzPhoneCountry(countryCode).code === countryCode;

/**
 * Validates all Step 2 fields and returns a map of field → error message.
 * An empty object means the step is valid.
 */
export function validateStep2(data: Pick<RegisterFormData, 'fullName' | 'birthdate' | 'phone' | 'phoneCountry'>): RegisterStep2Errors {
  const errors: RegisterStep2Errors = {};

  if (!data.fullName.trim()) {
    errors.fullName = 'O nome completo é obrigatório.';
  } else if (!isValidFullName(data.fullName)) {
    errors.fullName = 'Informe o nome e o sobrenome.';
  }

  if (!data.birthdate.trim()) {
    errors.birthdate = 'A data de nascimento é obrigatória.';
  } else if (!parseBirthdateBR(data.birthdate)) {
    errors.birthdate = 'Data de nascimento inválida.';
  } else if (!isAdultBirthdate(data.birthdate)) {
    errors.birthdate = 'Você precisa ter 18 anos ou mais para se cadastrar.';
  }

  const countryCode = data.phoneCountry ?? '';
  if (!data.phone.trim()) {
    errors.phone = 'O telefone é obrigatório.';
  } else if (hasNationalMask(countryCode) && !isValidFmzPhoneNumber(data.phone, countryCode)) {
    errors.phone = 'Número de telefone incompleto.';
  }

  return errors;
}

/**
 * Returns true when the error map has at least one non-undefined value.
 * Time: O(n) where n = number of keys (small constant ≤ 10).
 */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}
