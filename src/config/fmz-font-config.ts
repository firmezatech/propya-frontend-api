import { Inter } from 'next/font/google';

export const fmzInterBodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const fmzInterDisplayFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-syne',
});

export const fmzFontVariablesClassName = `${fmzInterBodyFont.variable} ${fmzInterDisplayFont.variable}`;

export const fmzFontFamily = {
  body: 'var(--font-dm-sans), sans-serif',
  display: 'var(--font-syne), sans-serif',
} as const;