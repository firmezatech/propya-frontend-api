/**
 * Sidebar layout and overflow policy for the admin shell.
 *
 * Keep these classes centralized so future pages can add long menu labels
 * without breaking the fixed sidebar/content scroll behavior.
 */
export const fmzAdminShellLayoutConfig = {
  root: 'flex h-[calc(100dvh-72px)] min-h-0 flex-1 overflow-hidden bg-[#F7F8FA] lg:flex-row',
  contentScroll: 'min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA]',
} as const;

export const fmzAdminSidebarLayoutConfig = {
  sidebar: 'z-30 flex h-full min-h-0 shrink-0 border-b border-fmz-border-light bg-white lg:w-[clamp(280px,18vw,320px)] lg:flex-col lg:border-b-0 lg:border-r',
  navigationArea: 'flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 py-3 lg:min-h-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:px-5 lg:py-5',
  link: 'flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] no-underline transition lg:w-full lg:shrink lg:items-start',
  linkActive: 'bg-[#F0F1F5] font-medium text-fmz-navy',
  linkInactive: 'text-fmz-text-muted hover:bg-fmz-page hover:text-fmz-text-primary',
  icon: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
  iconActive: 'border-fmz-navy bg-fmz-navy text-white',
  iconInactive: 'border-fmz-border-light bg-fmz-page',
  label: 'min-w-0 max-w-full whitespace-normal break-words leading-4 [overflow-wrap:anywhere]',
  emptyState: 'hidden rounded-lg border border-dashed border-fmz-border-light px-3 py-4 text-xs leading-5 text-fmz-text-hint lg:block',
  desktopFooter: 'hidden border-t border-fmz-border-light p-5 lg:block',
  mobileFooter: 'shrink-0 border-l border-fmz-border-light p-3 lg:hidden',
  logoutButton: 'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-fmz-error transition hover:bg-fmz-error-bg hover:text-fmz-error lg:w-full',
  logoutButtonCompact: 'justify-center px-2',
  logoutIcon: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#F5C4BF] bg-fmz-error-bg text-fmz-error',
} as const;
