import type { InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzFieldWrapper, fmzFieldControlClassName } from './FmzFieldWrapper';

type FmzDateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  hasError?: boolean;
  wrapperClassName?: string;
};

// O indicador nativo do calendário (::-webkit-calendar-picker-indicator) fica invisível mas
// esticado sobre o campo inteiro — clicar em qualquer ponto ainda abre o picker do browser.
// O ícone Calendar abaixo é só decoração (pointer-events-none), alinhado ao padrão visual do
// design system; ele nunca compete com o clique do indicador nativo.
const nativeIndicatorOverrideClassName =
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0';

export function FmzDateInput({ className, hasError = false, disabled, wrapperClassName, ...props }: FmzDateInputProps) {
  return (
    <FmzFieldWrapper
      className={wrapperClassName}
      hasError={hasError}
      disabled={disabled}
      trailingSlot={<Calendar className="pointer-events-none h-4 w-4 shrink-0 text-fmz-text-hint" aria-hidden="true" />}
    >
      <input
        type="date"
        disabled={disabled}
        className={fmzCn(fmzFieldControlClassName, 'relative cursor-pointer', nativeIndicatorOverrideClassName, className)}
        {...props}
      />
    </FmzFieldWrapper>
  );
}
