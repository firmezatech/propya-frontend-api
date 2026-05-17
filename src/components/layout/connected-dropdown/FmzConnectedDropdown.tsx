'use client';

import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { buildFmzConnectedUserInitials, buildFmzConnectedUserSummary } from '../connected-user/fmz-connected-user-storage';
import { performFirmezaLogout } from '../../../services/auth/fmz-logout';
import type { FmzConnectedDropdownItem } from './fmz-connected-dropdown.types';
import type { FmzConnectedUserSummary } from '../connected-user/fmz-connected-user.types';

type FmzConnectedDropdownProps = {
  items: readonly FmzConnectedDropdownItem[];
  localizeHref: (href: string) => string;
  defaultUserName: string;
  defaultUserEmail: string;
  locale?: string;
};

const isFmzConnectedDropdownItemActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(href) || pathname.includes(`${href}/`);
};

export function FmzConnectedDropdown({ items, localizeHref, defaultUserName, defaultUserEmail, locale }: FmzConnectedDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSummary, setUserSummary] = useState<FmzConnectedUserSummary>(() => ({
    name: defaultUserName,
    email: defaultUserEmail,
    initials: buildFmzConnectedUserInitials(defaultUserName),
  }));

  useEffect(() => {
    setUserSummary(buildFmzConnectedUserSummary());
    const syncUserSummary = () => setUserSummary(buildFmzConnectedUserSummary());
    window.addEventListener('storage', syncUserSummary);
    window.addEventListener('walletChanged', syncUserSummary);
    return () => {
      window.removeEventListener('storage', syncUserSummary);
      window.removeEventListener('walletChanged', syncUserSummary);
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const handleItemClick = (item: FmzConnectedDropdownItem) => {
    setIsDropdownOpen(false);
    if (item.id === 'logout') {
      performFirmezaLogout({ router, locale });
      return;
    }
    router.push(localizeHref(item.href));
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-2">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
        onClick={() => setIsDropdownOpen((currentState) => !currentState)}
        className={fmzCn(
          'flex select-none items-center gap-2.5 rounded-full border-[1.5px] border-transparent bg-transparent py-1.5 pl-1.5 pr-2.5 transition hover:border-fmz-border-light hover:bg-fmz-page',
          isDropdownOpen && 'border-fmz-border-light bg-fmz-page',
        )}
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-fmz-navy font-syne text-xs font-bold text-fmz-gold">{userSummary.initials}</span>
        <span className="min-w-[56px] max-w-[100px] truncate text-[13px] font-medium text-fmz-text-primary">{userSummary.name.split(' ')[0]}</span>
        <ChevronDown className={fmzCn('h-3.5 w-3.5 text-fmz-text-hint transition', isDropdownOpen && 'rotate-180')} aria-hidden="true" />
      </button>

      <div
        role="menu"
        className={fmzCn(
          'pointer-events-none absolute right-0 top-[calc(100%+10px)] w-[220px] origin-top-right scale-[0.97] rounded-[14px] border-[1.5px] border-fmz-border-light bg-white p-2 opacity-0 shadow-[0_8px_32px_rgba(13,19,33,0.10),0_2px_8px_rgba(13,19,33,0.05)] transition duration-200',
          isDropdownOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '-translate-y-2',
        )}
      >
        <div className="mb-1.5 border-b border-fmz-border-light px-3 pb-3 pt-2.5">
          <p className="truncate font-syne text-sm font-bold text-fmz-navy">{userSummary.name}</p>
          <p className="mt-0.5 truncate text-xs text-fmz-text-hint">{userSummary.email}</p>
        </div>

        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = isFmzConnectedDropdownItemActive(pathname, item.href);
          const hasSectionDivider = index > 0 && item.section !== items[index - 1]?.section;
          const isDanger = item.variant === 'danger';

          return (
            <div key={item.id}>
              {hasSectionDivider ? <div className="my-1.5 h-px bg-fmz-border-light" /> : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(item)}
                className={fmzCn(
                  'flex w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left font-sans text-sm text-fmz-text-muted transition hover:bg-fmz-page hover:text-fmz-text-primary',
                  isActive && !isDanger && 'bg-[#F0F1F5] font-medium text-fmz-navy',
                  isDanger && 'text-fmz-error hover:bg-fmz-error-bg hover:text-fmz-error',
                )}
              >
                <span
                  className={fmzCn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-fmz-page transition',
                    isActive && !isDanger && 'bg-fmz-navy text-white',
                    isDanger && 'bg-fmz-error-bg text-fmz-error',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {item.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
