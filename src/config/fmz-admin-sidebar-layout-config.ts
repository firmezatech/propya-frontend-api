/**
 * Sidebar layout and overflow policy for the admin shell.
 *
 * Keep these classes centralized so future pages can add long menu labels
 * without breaking the fixed sidebar/content scroll behavior.
 */
export const fmzAdminShellLayoutConfig = {
  root: 'flex min-h-0 flex-1 overflow-hidden bg-[#F7F8FA]',
  contentScroll: 'h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA]',
} as const;

export const fmzAdminSidebarLayoutConfig = {
  sidebar: 'z-30 hidden h-full min-h-0 w-[clamp(280px,18vw,320px)] shrink-0 flex-col self-stretch overflow-hidden border-r border-fmz-border-light bg-white lg:flex',
  navigationArea: 'flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-5 py-5',
  link: 'flex min-w-0 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] no-underline transition',
  linkActive: 'bg-[#F0F1F5] font-medium text-fmz-navy',
  linkInactive: 'text-fmz-text-muted hover:bg-fmz-page hover:text-fmz-text-primary',
  icon: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
  iconActive: 'border-fmz-navy bg-fmz-navy text-white',
  iconInactive: 'border-fmz-border-light bg-fmz-page',
  label: 'min-w-0 flex-1 whitespace-normal break-words text-left leading-5 [overflow-wrap:anywhere]',
  emptyState: 'rounded-lg border border-dashed border-fmz-border-light px-3 py-4 text-xs leading-5 text-fmz-text-hint',
  desktopFooter: 'hidden shrink-0 border-t border-fmz-border-light bg-white p-5 lg:block',
  mobileFooter: 'hidden',
  logoutButton: 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-fmz-error transition hover:bg-fmz-error-bg hover:text-fmz-error',
  logoutButtonCompact: 'justify-center px-2',
  logoutIcon: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#F5C4BF] bg-fmz-error-bg text-fmz-error',
} as const;
