import { DM_Sans, Syne } from 'next/font/google';

/**
 * Centralized typography setup for the whole app.
 *
 * Brand rules:
 * - Syne: titles, logo, buttons and highlighted elements (700, 800)
 * - DM Sans: body text, labels, values and general UI (400, 500, 600, 700, 800)
 */
export const fmzDmSansFont = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const fmzSyneFont = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
});

export const fmzFontVariablesClassName = `${fmzDmSansFont.variable} ${fmzSyneFont.variable}`;

export const fmzFontFamily = {
  body: 'var(--font-dm-sans), sans-serif',
  display: 'var(--font-syne), sans-serif',
} as const;
