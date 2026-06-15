'use client';

import type { NotificationTabConfig } from '../domain/fmz-notifications.types';
import { fmzCn } from '../../../lib/fmz-classnames';

export type FmzNotificationsToolbarProps = {
  tabs: NotificationTabConfig[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export function FmzNotificationsToolbar({ tabs, activeTab, onTabChange }: FmzNotificationsToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div
        role="tablist"
        className="flex items-center gap-0.5 rounded-[11px] border border-fmz-border-light bg-white p-[3px]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={tab.key === activeTab}
            onClick={() => onTabChange(tab.key)}
            className={fmzCn(
              'inline-flex cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[8px] px-3.5 py-1.5 text-[12.5px] font-medium transition-all',
              tab.key === activeTab
                ? 'bg-fmz-navy font-semibold text-white'
                : 'text-fmz-text-muted hover:text-fmz-navy',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={fmzCn(
                  'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold',
                  tab.key === activeTab
                    ? 'bg-white/20 text-white'
                    : 'bg-fmz-border-light text-fmz-text-muted',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
