import type { ReactNode } from 'react';
import { FmzConnectedLayoutFrame } from '../../../components/layout';

interface ConnectedLayoutProps {
  children: ReactNode;
}

export default function ConnectedLayout({ children }: ConnectedLayoutProps) {
  return <FmzConnectedLayoutFrame>{children}</FmzConnectedLayoutFrame>;
}
