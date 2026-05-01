"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LanguageDropdown from "app/[locale]/components/ui/LanguageDropdown";
import { useTranslations } from 'next-intl';

export default function HeaderHome() {
  const t = useTranslations('Header');

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-16 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image
              priority
              src="/logo.png"
              alt="Firmeza Token"
              width={60}
              height={60}
              className="dark:invert"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <h1 className="text-xl font-bold">&nbsp; {t('title')}</h1>
        </div>

        <nav className="flex-1 flex justify-center space-x-4">

        </nav>

        <div className="flex items-center gap-4">
        <Link
            href="https://wa.me/5511964850279"
            target="_blank"
            className="text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {t('helpLink')}
          </Link>
          {/* <LanguageDropdown/> */}

        </div>
      </div>
    </header>
  );
}
