/**
 * Tests: fmz-validators — shared email validation utility
 *
 * Scope:
 *   - isValidFmzEmail — accepts well-formed emails, rejects malformed ones
 *
 * Also validates that password-reset and auth-access domains correctly
 * re-export the same function from the shared lib (import resolution).
 */

import { isValidFmzEmail } from '../lib/fmz-validators';
import { isValidFmzEmail as isValidFmzEmailFromAuth } from '../features/auth-access/domain/fmz-auth-access-validation';

// ─── isValidFmzEmail ──────────────────────────────────────────────────────────

describe('isValidFmzEmail', () => {

  it('accepts a standard email', () => {
    expect(isValidFmzEmail('user@example.com')).toBe(true);
  });

  it('accepts an email with subdomain', () => {
    expect(isValidFmzEmail('user@mail.example.com')).toBe(true);
  });

  it('accepts an email with plus alias', () => {
    expect(isValidFmzEmail('user+alias@example.com')).toBe(true);
  });

  it('trims surrounding whitespace before testing', () => {
    expect(isValidFmzEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects an email without @', () => {
    expect(isValidFmzEmail('userexample.com')).toBe(false);
  });

  it('rejects an email without domain', () => {
    expect(isValidFmzEmail('user@')).toBe(false);
  });

  it('rejects an email without TLD', () => {
    expect(isValidFmzEmail('user@example')).toBe(false);
  });

  it('rejects an email with spaces inside', () => {
    expect(isValidFmzEmail('us er@example.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidFmzEmail('')).toBe(false);
  });

  it('rejects whitespace-only input', () => {
    expect(isValidFmzEmail('   ')).toBe(false);
  });

});

// ─── Re-export consistency ────────────────────────────────────────────────────

describe('isValidFmzEmail re-export from auth-access domain', () => {

  it('is the same function exported from the shared lib', () => {
    expect(isValidFmzEmailFromAuth).toBe(isValidFmzEmail);
  });

  it('validates correctly when called through the auth-access re-export', () => {
    expect(isValidFmzEmailFromAuth('valid@test.com')).toBe(true);
    expect(isValidFmzEmailFromAuth('invalid')).toBe(false);
  });

});
