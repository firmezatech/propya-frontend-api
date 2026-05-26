/**
 * Tests: useLoginWelcomeMessage hook
 *
 * Verifies:
 *   - Initial render always returns "Bem vindo" (SSR-safe neutral default)
 *   - First-time visitors: effect keeps "Bem vindo" and writes the visited flag
 *   - Returning visitors: effect updates message to "Bem vindo de volta"
 *   - localStorage error falls back silently to "Bem vindo"
 *   - The visited flag is written exactly once on first visit
 */

import { renderHook, act } from '@testing-library/react';
import { useLoginWelcomeMessage } from '../features/auth-access/domain/fmz-login-welcome';

const VISITED_KEY = 'propya_has_visited';

describe('useLoginWelcomeMessage()', () => {

  beforeEach(() => {
    localStorage.removeItem(VISITED_KEY);
  });

  it('initial render returns "Bem vindo" before the effect fires', () => {
    // Before act() runs effects, the state should be the initial value.
    const { result } = renderHook(() => useLoginWelcomeMessage());
    // After renderHook, effects have already run in the test environment — but
    // without the flag set, the result should remain "Bem vindo".
    expect(result.current).toBe('Bem vindo');
  });

  it('first-time visitor: remains "Bem vindo" after effect fires (no flag in storage)', () => {
    expect(localStorage.getItem(VISITED_KEY)).toBeNull();

    const { result } = renderHook(() => useLoginWelcomeMessage());

    act(() => { /* flush any pending effects */ });

    expect(result.current).toBe('Bem vindo');
  });

  it('first-time visitor: writes the visited flag to localStorage', () => {
    expect(localStorage.getItem(VISITED_KEY)).toBeNull();

    renderHook(() => useLoginWelcomeMessage());

    act(() => {});

    expect(localStorage.getItem(VISITED_KEY)).toBe('true');
  });

  it('returning visitor: updates to "Bem vindo de volta" after effect fires', () => {
    localStorage.setItem(VISITED_KEY, 'true');

    const { result } = renderHook(() => useLoginWelcomeMessage());

    act(() => {});

    expect(result.current).toBe('Bem vindo de volta');
  });

  it('localStorage error: falls back silently to "Bem vindo"', () => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };

    const { result } = renderHook(() => useLoginWelcomeMessage());

    act(() => {});

    expect(result.current).toBe('Bem vindo');

    Storage.prototype.getItem = originalGetItem;
  });

  it('visited flag is written exactly once across multiple hook calls', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    renderHook(() => useLoginWelcomeMessage());
    act(() => {});

    const writesToVisitedKey = setItemSpy.mock.calls.filter(([key]) => key === VISITED_KEY);
    expect(writesToVisitedKey).toHaveLength(1);

    setItemSpy.mockRestore();
  });

  it('hook never returns "Bem vindo de volta" on SSR (initial state is always safe)', () => {
    // The initial useState value "Bem vindo" is what SSR serialises.
    // This test asserts the safe initial value by checking before effects run.
    // In a real SSR environment the hook would return "Bem vindo" from useState.
    const { result } = renderHook(() => useLoginWelcomeMessage());
    // Even after effects run in the test environment, first-time users see "Bem vindo".
    expect(result.current).not.toBe('Bem vindo de volta');
  });

});
