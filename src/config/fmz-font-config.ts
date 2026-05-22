import { Inter } from 'next/font/google';

export const fmzInterFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-inter',
});

export const fmzFontVariablesClassName = fmzInterFont.variable;

export const fmzFontFamily = {
  body: 'var(--font-inter), sans-serif',
  display: 'var(--font-inter), sans-serif',
} as const;
