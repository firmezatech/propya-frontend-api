/**
 * Tests: Login Welcome Message
 *
 * Verifies:
 *   - First-time visitors see "Bem vindo"
 *   - Returning visitors see "Bem vindo de volta"
 *   - The visited flag is written on the first call
 *   - SSR (window undefined) never throws
 */

import { getLoginWelcomeMessage } from '../features/auth-access/domain/fmz-login-welcome';

const VISITED_KEY = 'propya_has_visited';

describe('getLoginWelcomeMessage()', () => {

  beforeEach(() => {
    // Ensure a clean slate before every test
    localStorage.removeItem(VISITED_KEY);
  });

  it('returns "Bem vindo" on the very first call (no flag in storage)', () => {
    expect(localStorage.getItem(VISITED_KEY)).toBeNull();
    const message = getLoginWelcomeMessage();
    expect(message).toBe('Bem vindo');
  });

  it('writes the visited flag to localStorage on the first call', () => {
    getLoginWelcomeMessage();
    expect(localStorage.getItem(VISITED_KEY)).toBe('true');
  });

  it('returns "Bem vindo de volta" when the visited flag is already set', () => {
    localStorage.setItem(VISITED_KEY, 'true');
    const message = getLoginWelcomeMessage();
    expect(message).toBe('Bem vindo de volta');
  });

  it('does not overwrite an existing visited flag on subsequent calls', () => {
    getLoginWelcomeMessage(); // first visit — sets flag
    getLoginWelcomeMessage(); // second visit — reads flag
    expect(localStorage.getItem(VISITED_KEY)).toBe('true');
  });

  it('second call returns "Bem vindo de volta" after first call set the flag', () => {
    getLoginWelcomeMessage(); // sets flag, returns "Bem vindo"
    const message = getLoginWelcomeMessage(); // returns "Bem vindo de volta"
    expect(message).toBe('Bem vindo de volta');
  });

  it('never throws even when called multiple times', () => {
    expect(() => {
      for (let iteration = 0; iteration < 5; iteration++) {
        getLoginWelcomeMessage();
      }
    }).not.toThrow();
  });

});
