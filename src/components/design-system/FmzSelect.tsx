import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzFieldWrapper, fmzFieldControlClassName } from './FmzFieldWrapper';

type FmzSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  wrapperClassName?: string;
};

// appearance-none remove o chrome nativo do <select> (que em alguns browsers ignora o
// border-radius do elemento) — a seta vem só do ChevronDown abaixo, alinhada pelo wrapper.
export function FmzSelect({ className, hasError = false, disabled, wrapperClassName, ...props }: FmzSelectProps) {
  return (
    <FmzFieldWrapper
      className={wrapperClassName}
      hasError={hasError}
      disabled={disabled}
      trailingSlot={<ChevronDown className="h-4 w-4 shrink-0 text-fmz-text-hint" aria-hidden="true" />}
    >
      <select
        disabled={disabled}
        className={fmzCn(fmzFieldControlClassName, 'cursor-pointer appearance-none pr-1', className)}
        {...props}
      />
    </FmzFieldWrapper>
  );
}
