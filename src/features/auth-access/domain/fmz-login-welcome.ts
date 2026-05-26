'use client';

// ─── Login Welcome Message ────────────────────────────────────────────────────
// Reads `propya_has_visited` from localStorage to determine whether to greet
// the user as a first-time or returning visitor.
//
// Implemented as a hook so that localStorage is only accessed inside useEffect —
// never during SSR or pre-hydration. The initial render always returns "Bem vindo"
// (a safe neutral default); the effect corrects to "Bem vindo de volta" for
// returning visitors on the client, after hydration is complete.

import { useState, useEffect } from 'react';

const LOGIN_VISITED_KEY = 'propya_has_visited';

/**
 * Returns a personalised welcome message based on whether the user has visited
 * before. The initial value is always "Bem vindo" — the effect updates it
 * on the client after hydration, ensuring no SSR/client mismatch.
 *
 * First-time visitors: "Bem vindo" (and the flag is written to localStorage).
 * Returning visitors:  "Bem vindo de volta".
 * localStorage error:  falls back to "Bem vindo" silently.
 */
export function useLoginWelcomeMessage(): string {
  const [message, setMessage] = useState('Bem vindo');

  useEffect(() => {
    try {
      const hasVisited = window.localStorage.getItem(LOGIN_VISITED_KEY) === 'true';

      if (hasVisited) {
        setMessage('Bem vindo de volta');
        return;
      }

      window.localStorage.setItem(LOGIN_VISITED_KEY, 'true');
      setMessage('Bem vindo');
    } catch {
      // localStorage unavailable (e.g. private browsing with strict settings).
      // Safe fallback — never throw, never expose "de volta" on error.
      setMessage('Bem vindo');
    }
  }, []);

  return message;
}
