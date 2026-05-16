import React from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { setRequestLocale } from 'next-intl/server';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { fmzFontVariablesClassName } from '../../config/fmz-font-config';

import { ProfileProvider } from "../context/ProfileContext";
import { LanguageProvider } from "../context/LanguageContext";

import "./../globals.css";

export const metadata: Metadata = {
  title: fmzPublicLayoutConfig.appName,
  description: "Sem barreiras. Sem dívidas de longo prazo.",
  icons: {
    icon: [
      { url: fmzPublicLayoutConfig.logoPath, type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: [{ url: fmzPublicLayoutConfig.logoPath, type: 'image/png' }],
    apple: [{ url: fmzPublicLayoutConfig.logoPath, type: 'image/png' }],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className={`${fmzFontVariablesClassName} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageProvider>
            <ProfileProvider>
              {children}
            </ProfileProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
