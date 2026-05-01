"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { useProfile } from '../../context/ProfileContext';
import { useTranslations } from 'next-intl';

interface Props {
  profile: number | null;
  propertyId: number;
}

export default function TokensPurchaseBanner({ profile, propertyId }: Props) {
  const { setCurrentProfile, setPropertyId } = useProfile();
  const router = useRouter();
  const t = useTranslations('TokensPurchaseBanner');

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="relative">
      <div className="absolute px-4 top-0 transform -translate-y-1/3 z-10">
        <img
          src="/cadeado.png"
          alt="Cadeado"
          className="h-30 w-30 relative"
        />
      </div>

      <div className="bg-indigo-50 py-4 px-4 rounded-xl flex items-center justify-between pl-20">
        <div className="flex items-center">
          <span className="ml-10">
            <span className="text-indigo-600 text-sm">{t('accumulateMoreTokens')}</span> {t('advanceToYourHome')}
          </span>
        </div>
        <button
          className="bg-blue-600 text-xs text-white font-bold px-12 py-3 rounded-full"
          onClick={() => {
            setCurrentProfile(profile);
            setPropertyId(propertyId);
            handleNavigation("/connected/tokensToPurchasePix");
          }}
        >
          {t('buyTokens')}
        </button>
      </div>
    </div>
  );
}
