/**
 * Tests: connected user summary resolver + initials
 *
 * Verifies the connected header/dropdown identity resolution:
 *   - Backend principal name wins over localStorage
 *   - localStorage is used only as a fallback
 *   - email prefix is used when no name exists
 *   - neutral "Usuária" fallback — never the "Firmeza Token" brand name
 *   - backend-provided initials are preferred, otherwise derived from the name
 */

import {
  buildFmzConnectedUserInitials,
  resolveConnectedUserSummary,
} from '../components/layout/connected-user/fmz-connected-user-storage';

describe('resolveConnectedUserSummary()', () => {
  it('prefers the backend principal name over localStorage', () => {
    const summary = resolveConnectedUserSummary({
      principalName: 'Mirella Souza',
      principalEmail: 'mirella@email.com',
      storedName: 'Nome Antigo',
      storedEmail: 'old@email.com',
    });
    expect(summary.name).toBe('Mirella Souza');
    expect(summary.email).toBe('mirella@email.com');
    expect(summary.initials).toBe('MS');
  });

  it('falls back to localStorage name when the principal name is absent', () => {
    const summary = resolveConnectedUserSummary({
      principalName: null,
      storedName: 'Ana Lima',
      storedEmail: 'ana@email.com',
    });
    expect(summary.name).toBe('Ana Lima');
    expect(summary.initials).toBe('AL');
  });

  it('uses the email prefix when no name is available (principal email)', () => {
    const summary = resolveConnectedUserSummary({
      principalName: '',
      principalEmail: 'mirella@email.com',
      storedName: '',
    });
    expect(summary.name).toBe('mirella');
  });

  it('uses the stored email prefix when only stored email exists', () => {
    const summary = resolveConnectedUserSummary({
      storedEmail: 'joana@email.com',
    });
    expect(summary.name).toBe('joana');
  });

  it('falls back to the neutral default — never "Firmeza Token"', () => {
    const summary = resolveConnectedUserSummary({});
    expect(summary.name).toBe('Usuária');
    expect(summary.name).not.toBe('Firmeza Token');
  });

  it('honours an explicit neutral default and never echoes a brand name', () => {
    const summary = resolveConnectedUserSummary({ defaultName: 'Usuária' });
    expect(summary.name).toBe('Usuária');
  });

  it('prefers backend-provided initials over derived initials', () => {
    const summary = resolveConnectedUserSummary({
      principalName: 'Mirella Souza',
      principalInitials: 'XY',
    });
    expect(summary.initials).toBe('XY');
  });

  it('whitespace-only principal values are treated as absent', () => {
    const summary = resolveConnectedUserSummary({
      principalName: '   ',
      storedName: 'Bruna Reis',
    });
    expect(summary.name).toBe('Bruna Reis');
  });
});

describe('buildFmzConnectedUserInitials()', () => {
  it('derives two initials from a full name', () => {
    expect(buildFmzConnectedUserInitials('Mirella Souza')).toBe('MS');
  });

  it('uses the first two letters of a single-word name', () => {
    expect(buildFmzConnectedUserInitials('mirella')).toBe('MI');
  });

  it('falls back to neutral "U" for an empty name — never brand initials', () => {
    expect(buildFmzConnectedUserInitials('')).toBe('U');
    expect(buildFmzConnectedUserInitials('')).not.toBe('FT');
  });
});
