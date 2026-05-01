import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import {setRequestLocale} from 'next-intl/server';

import { ProfileProvider } from "../context/ProfileContext";
import { LanguageProvider } from "../context/LanguageContext";

import "./../globals.css";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600', '700']
});

export const metadata: Metadata = {
  title: "Firmeza Token",
  description: "Sem barreiras. Sem dívidas de longo prazo.",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {

  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  // Dynamically import the messages JSON file for the current locale
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (

    <html lang={locale}>
      <body className={`${inter.variable} antialiased`}>
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
