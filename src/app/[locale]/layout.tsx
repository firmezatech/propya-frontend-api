import React from "react";
import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import { ProfileProvider } from "../context/ProfileContext";
import { LanguageProvider } from "../context/LanguageContext";

import "./../globals.css";

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "Firmeza Token",
  description: "Sem barreiras. Sem dívidas de longo prazo.",
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
      <body className={`${dmSans.variable} ${syne.variable} antialiased`}>
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
