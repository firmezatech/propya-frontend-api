import type { SelectHTMLAttributes } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const fmzSelectClassName = 'rounded-[10px] border-[1.5px] border-fmz-border-light bg-fmz-input px-3 py-[13px] text-[15px] text-fmz-text-primary outline-none transition focus:border-fmz-gold focus:bg-white focus:ring-[3px] focus:ring-fmz-gold/15';
export const fmzSelectErrorClassName = 'border-[#F5C4BF] bg-[#FEF5F4] focus:border-[#D94F3D] focus:ring-[3px] focus:ring-[#D94F3D]/10';

export function FmzSelect({ className, children, hasError = false, ...props }: FmzSelectProps) {
  return (
    <select className={fmzCn(fmzSelectClassName, hasError && fmzSelectErrorClassName, className)} {...props}>
      {children}
    </select>
  );
}
