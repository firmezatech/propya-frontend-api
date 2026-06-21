import type { ReactNode } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzFieldWrapperProps = {
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  children: ReactNode;
};

// O raio/borda/overflow vivem SÓ aqui — nunca no controle nativo (input/select) dentro dele.
// overflow-hidden garante que o canto nunca "quadra" quando o select/calendário abre ou o
// estado de foco aparece: o popover nativo (dropdown do select, picker de data) é renderizado
// pelo browser fora da árvore deste div, então nunca é afetado pelo overflow-hidden.
export const fmzFieldWrapperClassName =
  'flex h-[52px] items-center gap-2 overflow-hidden rounded-[10px] border-[1.5px] border-fmz-border-light bg-fmz-input px-4 transition focus-within:border-fmz-gold focus-within:bg-white focus-within:ring-[3px] focus-within:ring-fmz-gold/15';

export const fmzFieldWrapperErrorClassName =
  'border-[#F5C4BF] bg-[#FEF5F4] focus-within:border-[#D94F3D] focus-within:ring-[3px] focus-within:ring-[#D94F3D]/10';

// Classe para o input/select nativo que vive dentro do wrapper: sem borda, raio ou fundo
// próprios — todo o visual do campo é responsabilidade exclusiva do FmzFieldWrapper.
export const fmzFieldControlClassName =
  'h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-fmz-text-primary outline-none placeholder:text-fmz-text-hint disabled:cursor-not-allowed';

export function FmzFieldWrapper({ className, hasError = false, disabled = false, leadingIcon, trailingSlot, children }: FmzFieldWrapperProps) {
  return (
    <div
      className={fmzCn(
        fmzFieldWrapperClassName,
        hasError && fmzFieldWrapperErrorClassName,
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingSlot}
    </div>
  );
}
