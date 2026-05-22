'use client';

import { Bell, ChevronDown, ChevronRight, CreditCard, HelpCircle, MessageCircle, Target, TrendingUp } from 'lucide-react';
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
  roleLabel?: string;
};

const isFmzConnectedDropdownItemActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(href) || pathname.includes(`${href}/`);
};

export function FmzConnectedDropdown({ items, localizeHref, defaultUserName, defaultUserEmail, locale, roleLabel = 'Inquilina' }: FmzConnectedDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
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
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const handleItemClick = (item: FmzConnectedDropdownItem) => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
    if (item.id === 'logout') {
      performFirmezaLogout({ router, locale });
      return;
    }
    router.push(localizeHref(item.href));
  };

  const closeMenus = () => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const toggleUserMenu = () => {
    setIsNotificationsOpen(false);
    setIsDropdownOpen((currentState) => !currentState);
  };

  const toggleNotifications = () => {
    setIsDropdownOpen(false);
    setIsNotificationsOpen((currentState) => !currentState);
  };

  const markNotificationsAsRead = () => setHasUnreadNotifications(false);

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-2">
      <button
        type="button"
        aria-label="Ajuda"
        onClick={() => router.push(localizeHref('/connected/comingSoon'))}
        className="hidden items-center gap-1.5 rounded-lg bg-transparent px-3 py-2 text-[13px] font-medium text-fmz-text-muted transition hover:bg-fmz-page hover:text-fmz-navy sm:inline-flex"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Ajuda
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label="Notificações"
          aria-haspopup="menu"
          aria-expanded={isNotificationsOpen}
          onClick={toggleNotifications}
          className={fmzCn(
            'relative grid h-[38px] w-[38px] place-items-center rounded-[10px] border-[1.5px] border-fmz-border-light bg-white text-fmz-navy transition hover:-translate-y-0.5 hover:border-fmz-navy',
            isNotificationsOpen && 'border-fmz-navy -translate-y-0.5',
          )}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {hasUnreadNotifications ? <span className="absolute right-2 top-2 h-[9px] w-[9px] rounded-full border-2 border-white bg-[#E63946] shadow-[0_0_0_1px_rgba(230,57,70,0.25)]" /> : null}
        </button>

        <div
          role="menu"
          className={fmzCn(
            'pointer-events-none absolute right-0 top-[calc(100%+10px)] z-[200] w-[min(380px,calc(100vw-24px))] origin-top-right scale-[0.98] overflow-hidden rounded-[14px] border border-fmz-border-light bg-white opacity-0 shadow-[0_18px_48px_-12px_rgba(14,22,38,0.18),0_2px_6px_rgba(14,22,38,0.06)] transition duration-150',
            isNotificationsOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '-translate-y-1.5',
          )}
        >
          <div className="flex items-center justify-between border-b border-[#EDEFF4] px-4 py-3.5">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-[-0.005em] text-fmz-navy">
              Notificações
              {hasUnreadNotifications ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#E63946] px-1.5 text-[10px] font-bold text-white">3</span> : null}
            </span>
            <button type="button" onClick={markNotificationsAsRead} className="rounded-md px-2 py-1 text-xs font-semibold text-fmz-text-muted transition hover:bg-fmz-page hover:text-fmz-navy">
              Marcar todas como lidas
            </button>
          </div>

          <div className="max-h-[440px] overflow-y-auto py-1.5">
            <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-fmz-text-hint">Hoje</div>
            <NotificationItem unread={hasUnreadNotifications} iconTone="gold" icon={CreditCard} title="Boleto disponível" time="há 4h" description="Confira o boleto do mês e pague via PIX para compensação imediata." />
            <NotificationItem unread={hasUnreadNotifications} iconTone="blue" icon={MessageCircle} title="Mensagem da gestora" time="há 7h" description="Há uma nova atualização sobre o seu imóvel." />
            <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-fmz-text-hint">Esta semana</div>
            <NotificationItem unread={hasUnreadNotifications} iconTone="green" icon={Target} title="Compra programada executada" time="há 3 dias" description="Seus tokens foram atualizados na carteira." />
            <NotificationItem iconTone="green" icon={TrendingUp} title="Seu aluguel foi atualizado" time="há 5 dias" description="O desconto foi recalculado com base na sua participação atual." />
          </div>

          <div className="flex items-center justify-between border-t border-[#EDEFF4] bg-[#FAFBFC] px-4 py-3">
            <button type="button" onClick={() => { closeMenus(); router.push(localizeHref('/connected/comingSoon')); }} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-fmz-navy transition hover:text-[#8A6B12]">
              Ver todas as notificações <ChevronRight className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => { closeMenus(); router.push(localizeHref('/connected/comingSoon')); }} className="text-xs text-fmz-text-hint transition hover:text-fmz-navy">
              Preferências
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          onClick={toggleUserMenu}
          className={fmzCn(
            'flex select-none items-center gap-[9px] rounded-full border-[1.5px] border-fmz-border-light bg-white py-1 pl-1 pr-3.5 transition hover:-translate-y-0.5 hover:border-fmz-navy hover:shadow-[0_6px_18px_rgba(14,22,38,0.08)]',
            isDropdownOpen && 'border-fmz-navy -translate-y-0.5 shadow-[0_6px_18px_rgba(14,22,38,0.08)]',
          )}
        >
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border-[1.5px] border-fmz-gold bg-fmz-navy text-[11px] font-bold tracking-[0.04em] text-fmz-gold shadow-[0_0_0_2px_rgba(232,182,32,0.2)]">{userSummary.initials}</span>
          <span className="hidden max-w-[130px] truncate text-[13px] font-semibold tracking-[-0.005em] text-fmz-navy sm:inline">{userSummary.name}</span>
          <ChevronDown className={fmzCn('h-3.5 w-3.5 text-fmz-text-hint transition', isDropdownOpen && 'rotate-180')} aria-hidden="true" />
        </button>

        <div
          role="menu"
          className={fmzCn(
            'pointer-events-none absolute right-0 top-[calc(100%+10px)] z-[200] w-[268px] origin-top-right scale-[0.98] rounded-[14px] border border-fmz-border-light bg-white p-2 opacity-0 shadow-[0_18px_48px_-12px_rgba(14,22,38,0.18),0_2px_6px_rgba(14,22,38,0.06)] transition duration-150',
            isDropdownOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '-translate-y-1.5',
          )}
        >
          <div className="mb-1.5 flex items-center gap-3 border-b border-[#EDEFF4] px-3 pb-3 pt-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-fmz-gold bg-fmz-navy text-xs font-bold tracking-[0.04em] text-fmz-gold shadow-[0_0_0_2px_rgba(232,182,32,0.2)]">{userSummary.initials}</span>
            <span className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.005em] text-fmz-navy">{userSummary.name}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A6B12] before:h-1.5 before:w-1.5 before:rounded-full before:bg-fmz-gold before:content-['']">{roleLabel}</p>
            </span>
          </div>

          <div className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-fmz-text-hint">Navegar</div>

          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = isFmzConnectedDropdownItemActive(pathname, item.href);
            const hasSectionDivider = index > 0 && item.section !== items[index - 1]?.section;
            const isDanger = item.variant === 'danger';

            return (
              <div key={item.id}>
                {hasSectionDivider ? <div className="my-1.5 h-px bg-[#EDEFF4]" /> : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                  className={fmzCn(
                    'group relative flex w-full items-center gap-3 rounded-[9px] border-0 bg-transparent px-3 py-2.5 text-left text-[13.5px] font-medium text-fmz-text-primary transition hover:bg-fmz-page hover:text-fmz-navy',
                    isActive && !isDanger && 'bg-fmz-page font-semibold text-fmz-navy before:absolute before:left-1 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-fmz-gold',
                    isDanger && 'text-fmz-error hover:bg-fmz-error-bg hover:text-fmz-error',
                  )}
                >
                  <span
                    className={fmzCn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-fmz-page text-fmz-navy transition group-hover:bg-[#FBF3DA] group-hover:text-[#8A6B12]',
                      isActive && !isDanger && 'bg-[#FBF3DA] text-[#8A6B12]',
                      isDanger && 'bg-fmz-error-bg text-fmz-error group-hover:bg-fmz-error-bg group-hover:text-fmz-error',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!isDanger ? <ChevronRight className="h-3 w-3 shrink-0 text-fmz-text-hint transition group-hover:translate-x-0.5 group-hover:text-fmz-navy" aria-hidden="true" /> : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type NotificationItemProps = {
  unread?: boolean;
  iconTone: 'gold' | 'green' | 'blue' | 'navy';
  icon: typeof Bell;
  title: string;
  time: string;
  description: string;
};

const notificationIconToneClassNames: Record<NotificationItemProps['iconTone'], string> = {
  gold: 'bg-[#FBF3DA] text-[#8A6B12]',
  green: 'bg-[#E8F5EE] text-[#127A4F]',
  blue: 'bg-[#E8EFFC] text-[#1F5BD6]',
  navy: 'bg-fmz-page text-fmz-navy',
};

function NotificationItem({ unread = false, iconTone, icon: Icon, title, time, description }: NotificationItemProps) {
  return (
    <button type="button" role="menuitem" className="grid w-full grid-cols-[auto_32px_1fr] items-start gap-3 px-3 py-3 text-left transition hover:bg-fmz-page">
      <span className={fmzCn('mt-3 h-2 w-2 rounded-full', unread ? 'bg-fmz-gold shadow-[0_0_0_3px_rgba(232,182,32,0.18)]' : 'bg-transparent')} />
      <span className={fmzCn('mt-0.5 grid h-8 w-8 place-items-center rounded-[9px]', notificationIconToneClassNames[iconTone])}>
        <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="mb-1 flex items-baseline justify-between gap-2 text-[13px] font-semibold leading-snug tracking-[-0.005em] text-fmz-navy">
          <span className="truncate">{title}</span>
          <span className="shrink-0 text-[11px] font-medium text-fmz-text-hint">{time}</span>
        </span>
        <span className="block text-[12.5px] leading-relaxed text-fmz-text-muted">{description}</span>
      </span>
    </button>
  );
}

