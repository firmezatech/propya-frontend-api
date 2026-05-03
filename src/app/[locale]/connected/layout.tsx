import type { ReactNode } from 'react';
import HeaderConn from './components/HeaderConn';
import FooterConn from './components/FooterConn';
import AuthenticatedRoute from './components/AuthenticatedRoute';

interface ConnectedLayoutProps {
  children: ReactNode;
}

export default function ConnectedLayout({ children }: ConnectedLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <HeaderConn />
      <AuthenticatedRoute>
        <div className="flex flex-1 flex-col">{children}</div>
      </AuthenticatedRoute>
      <FooterConn />
    </div>
  );
}
