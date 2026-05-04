'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../../../../config/fmz-public-layout-config';
import HeaderConn from '../HeaderConn';
import FooterConn from '../FooterConn';
import AuthenticatedRoute from '../AuthenticatedRoute';
import { FmzAdminLayout, isFmzAdminConnectedPath } from '../../../../../components/layout/FmzAdminLayout';

interface FmzConnectedLayoutFrameProps {
  children: ReactNode;
}

const isConnectedLogoutPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(fmzPublicLayoutConfig.connectedLogoutPath);
};

const readIsAdminProfile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const storedProfile = localStorage.getItem(fmzPublicLayoutConfig.connectedUserProfileStorageKey)?.trim().toLowerCase();
  return storedProfile === '0' || storedProfile === 'admin' || storedProfile === 'administrator';
};

export default function FmzConnectedLayoutFrame({ children }: FmzConnectedLayoutFrameProps) {
  const pathname = usePathname();
  const [isAdminProfile, setIsAdminProfile] = useState(false);
  const isLogoutPage = isConnectedLogoutPath(pathname);
  const isAdminPage = isAdminProfile || isFmzAdminConnectedPath(pathname);

  useEffect(() => {
    const syncAdminProfile = () => setIsAdminProfile(readIsAdminProfile());
    syncAdminProfile();
    window.addEventListener('storage', syncAdminProfile);
    window.addEventListener('walletChanged', syncAdminProfile);
    return () => {
      window.removeEventListener('storage', syncAdminProfile);
      window.removeEventListener('walletChanged', syncAdminProfile);
    };
  }, []);

  if (isLogoutPage) {
    return <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-fmz-text-primary">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <AuthenticatedRoute>
        <HeaderConn />
        {isAdminPage ? (
          <FmzAdminLayout>{children}</FmzAdminLayout>
        ) : (
          <div className="flex flex-1 flex-col">{children}</div>
        )}
        <FooterConn />
      </AuthenticatedRoute>
    </div>
  );
}
