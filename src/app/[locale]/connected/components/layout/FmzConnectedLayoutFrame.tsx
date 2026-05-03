'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../../../../config/fmz-public-layout-config';
import HeaderConn from '../HeaderConn';
import FooterConn from '../FooterConn';
import AuthenticatedRoute from '../AuthenticatedRoute';

interface FmzConnectedLayoutFrameProps {
  children: ReactNode;
}

const isConnectedLogoutPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(fmzPublicLayoutConfig.connectedLogoutPath);
};

export default function FmzConnectedLayoutFrame({ children }: FmzConnectedLayoutFrameProps) {
  const pathname = usePathname();
  const isLogoutPage = isConnectedLogoutPath(pathname);

  if (isLogoutPage) {
    return <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-fmz-text-primary">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <AuthenticatedRoute>
        <HeaderConn />
        <div className="flex flex-1 flex-col">{children}</div>
        <FooterConn />
      </AuthenticatedRoute>
    </div>
  );
}
