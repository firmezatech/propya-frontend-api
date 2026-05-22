'use client';

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzButtonVariant = 'primary' | 'link' | 'icon' | 'secondary';

type FmzButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: FmzButtonVariant;
}>;

const fmzButtonBaseClassName = 'inline-flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fmz-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const fmzButtonVariantClassNames: Record<FmzButtonVariant, string> = {
  primary: 'w-full rounded-[10px] border-0 bg-fmz-navy px-4 py-3.5 font-sans text-sm font-bold uppercase tracking-[0.05em] text-white hover:-translate-y-0.5 hover:bg-[#162030] hover:shadow-[0_8px_24px_rgba(13,19,33,0.15)] active:translate-y-0',
  secondary: 'w-full rounded-[10px] border-[1.5px] border-fmz-border-mid bg-white px-4 py-3 text-sm font-medium text-fmz-text-muted hover:border-fmz-navy hover:bg-fmz-input hover:text-fmz-text-primary',
  link: 'bg-transparent p-0 text-sm font-medium text-fmz-blue no-underline hover:underline',
  icon: 'h-9 w-9 rounded-md border-0 bg-transparent p-0 text-fmz-text-hint hover:bg-transparent hover:text-fmz-navy',
};

export function FmzButton({ variant = 'primary', className, children, type = 'button', ...props }: FmzButtonProps) {
  return (
    <button
      type={type}
      className={fmzCn(fmzButtonBaseClassName, fmzButtonVariantClassNames[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
