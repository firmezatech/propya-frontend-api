import { Home, LogOut, UserRound } from 'lucide-react';
import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import type { FmzConnectedDropdownItem, FmzConnectedDropdownItemId } from './fmz-connected-dropdown.types';

export const fmzConnectedDropdownItems: readonly FmzConnectedDropdownItem[] = [
  {
    id: 'dashboard',
    label: fmzPublicLayoutConfig.connectedDashboardLabel,
    href: fmzPublicLayoutConfig.connectedDashboardPath,
    icon: Home,
    variant: 'default',
    section: 'main',
  },
  {
    id: 'account',
    label: fmzPublicLayoutConfig.connectedAccountLabel,
    href: fmzPublicLayoutConfig.connectedAccountPath,
    icon: UserRound,
    variant: 'default',
    section: 'main',
  },
  {
    id: 'logout',
    label: fmzPublicLayoutConfig.connectedLogoutLabel,
    href: fmzPublicLayoutConfig.connectedLogoutPath,
    icon: LogOut,
    variant: 'danger',
    section: 'session',
  },
] as const;

export const fmzConnectedDropdownItemsById = new Map<FmzConnectedDropdownItemId, FmzConnectedDropdownItem>(
  fmzConnectedDropdownItems.map((item) => [item.id, item]),
);
