// ─── Login Welcome Message ────────────────────────────────────────────────────
// Reads `propya_has_visited` from localStorage to determine whether to greet
// the user as a first-time or returning visitor.
//
// Invariant: only call this on the client — it accesses `window.localStorage`.

const VISITED_KEY = 'propya_has_visited';

/**
 * Returns a personalised welcome message based on whether the user has visited
 * before. On the first call it records the visit and returns "Bem vindo"; on
 * subsequent calls it returns "Bem vindo de volta".
 *
 * Safe to call at component mount (useState initializer or useEffect).
 */
export function getLoginWelcomeMessage(): string {
  if (typeof window === 'undefined') {
    // SSR: always treat as returning visitor; client will correct on hydration.
    return 'Bem vindo de volta';
  }

  const hasVisited = window.localStorage.getItem(VISITED_KEY);

  if (!hasVisited) {
    window.localStorage.setItem(VISITED_KEY, 'true');
    return 'Bem vindo';
  }

  return 'Bem vindo de volta';
}
