import type { ReactNode } from 'react';
import { hasLocale } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { fmzFontVariablesClassName } from '../../config/fmz-font-config';
import { ProfileProvider } from '../context/ProfileContext';
import '../globals.css';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={fmzFontVariablesClassName} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
