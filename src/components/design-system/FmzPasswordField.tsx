'use client';

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzFieldWrapper, fmzFieldControlClassName } from './FmzFieldWrapper';
import { FmzPasswordVisibilityButton } from './FmzPasswordVisibilityButton';

type FmzPasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  hasError?: boolean;
  wrapperClassName?: string;
  leadingIcon?: ReactNode;
  /** Controlado: quando informado junto com onToggleVisible, a visibilidade vive no caller. */
  isVisible?: boolean;
  onToggleVisible?: () => void;
  showLabel?: string;
  hideLabel?: string;
};

// Controlado se isVisible/onToggleVisible forem passados (ex.: FmzPasswordCard, que já eleva
// esse estado a FmzAccountPage); não-controlado por padrão (estado local), sem exigir nada do
// caller. Mesmo princípio de inputs controlados/não-controlados do React — não duplica estado.
export function FmzPasswordField({
  className,
  hasError = false,
  disabled,
  wrapperClassName,
  leadingIcon,
  isVisible: controlledIsVisible,
  onToggleVisible,
  showLabel = 'Mostrar senha',
  hideLabel = 'Ocultar senha',
  ...props
}: FmzPasswordFieldProps) {
  const [localIsVisible, setLocalIsVisible] = useState(false);
  const isVisible = controlledIsVisible ?? localIsVisible;
  const toggleVisible = onToggleVisible ?? (() => setLocalIsVisible((current) => !current));

  return (
    <FmzFieldWrapper
      className={wrapperClassName}
      hasError={hasError}
      disabled={disabled}
      leadingIcon={leadingIcon}
      trailingSlot={
        <FmzPasswordVisibilityButton
          isVisible={isVisible}
          onClick={toggleVisible}
          aria-label={isVisible ? hideLabel : showLabel}
          title={isVisible ? hideLabel : showLabel}
        />
      }
    >
      <input
        type={isVisible ? 'text' : 'password'}
        disabled={disabled}
        className={fmzCn(fmzFieldControlClassName, className)}
        {...props}
      />
    </FmzFieldWrapper>
  );
}
