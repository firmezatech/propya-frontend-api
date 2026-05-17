import type { LucideIcon } from 'lucide-react';

export type FmzConnectedDropdownItemId = string;

export type FmzConnectedDropdownItemVariant = 'default' | 'danger';

export type FmzConnectedDropdownItem = {
  id: FmzConnectedDropdownItemId;
  label: string;
  href: string;
  icon: LucideIcon;
  variant: FmzConnectedDropdownItemVariant;
  section: 'main' | 'session';
};

