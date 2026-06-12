import { Inter, JetBrains_Mono } from 'next/font/google';

export const fmzInterFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-inter',
});

export const fmzJetBrainsMonoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

export const fmzFontVariablesClassName = [
  fmzInterFont.variable,
  fmzJetBrainsMonoFont.variable,
].join(' ');

export const fmzFontFamily = {
  body: 'var(--font-inter), sans-serif',
  display: 'var(--font-inter), sans-serif',
  mono: 'var(--font-mono), ui-monospace, monospace',
} as const;
