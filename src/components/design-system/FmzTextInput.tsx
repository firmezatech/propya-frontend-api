import type { InputHTMLAttributes } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const fmzTextInputClassName = 'w-full rounded-[10px] border-[1.5px] border-fmz-border-light bg-fmz-input px-4 py-[13px] text-[15px] text-fmz-text-primary placeholder:text-fmz-text-hint outline-none transition focus:border-fmz-gold focus:bg-white focus:ring-[3px] focus:ring-fmz-gold/15';

export const fmzTextInputErrorClassName = 'border-[#F5C4BF] bg-[#FEF5F4] focus:border-[#D94F3D] focus:ring-[3px] focus:ring-[#D94F3D]/10';

export function FmzTextInput({ className, hasError = false, ...props }: FmzTextInputProps) {
  return <input className={fmzCn(fmzTextInputClassName, hasError && fmzTextInputErrorClassName, className)} {...props} />;
}
