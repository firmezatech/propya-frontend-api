'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzPasswordVisibilityButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isVisible: boolean;
};

export function FmzPasswordVisibilityButton({ isVisible, className, ...props }: FmzPasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
      className={fmzCn(
        'absolute right-3 top-1/2 flex -translate-y-1/2 items-center rounded-md border-0 bg-transparent p-1 text-fmz-text-hint transition hover:text-fmz-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-fmz-gold focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
