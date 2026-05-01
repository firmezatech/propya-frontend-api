"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import UserConnected from "./UserConnected";

export default function Header() {
  const t = useTranslations('Header');
  
  return (
    <header className="bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center">
          <Link href="/connected/dashboard">
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
          <h1 className="text-xl font-bold">&nbsp; &nbsp;{t('title')}</h1>
        </div>

        {/* <nav className="w-full md:flex-1 flex flex-col md:flex-row justify-center items-center md:space-x-4 space-y-3 md:space-y-0">
          <Link href="/connected/invest" className="text-gray-600">
            {t('myInvestments')}
          </Link>
          <Link href="https://firmezatoken.com.br/" target="_blank" className="text-orange-600">{t('newOpportunities')}</Link>
        </nav> */}

        <div className="flex items-center">
          <UserConnected />
        </div>
      </div>
    </header>
  );
}