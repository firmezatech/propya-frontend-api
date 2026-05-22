import type { PropsWithChildren, ReactNode } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzCardProps = PropsWithChildren<{
  className?: string;
}>;

type FmzCardHeaderProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
};

export function FmzCard({ children, className }: FmzCardProps) {
  return (
    <section className={fmzCn('mb-5 rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 md:px-9', className)}>
      {children}
    </section>
  );
}

export function FmzCardHeader({ icon, title, subtitle }: FmzCardHeaderProps) {
  return (
    <div className="mb-7 flex items-center gap-3 border-b border-fmz-border-light pb-5">
      {icon ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-fmz-border-light bg-fmz-input text-fmz-text-muted">
          {icon}
        </div>
      ) : null}
      <div>
        <h2 className="font-sans text-[15px] font-bold tracking-[-0.01em] text-fmz-navy">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-fmz-text-hint">{subtitle}</p> : null}
      </div>
    </div>
  );
}
