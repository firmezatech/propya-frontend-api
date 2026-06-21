'use client';

import { FmzPasswordField } from '../../../components/design-system';
import { FmzFieldErrorMessage } from '../../api-errors/components';

type FmzPasswordInputProps = {
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
  ariaLabel: string;
  errorMessage?: string;
};

export function FmzPasswordInput({
  label,
  name,
  placeholder,
  autoComplete,
  showLabel,
  hideLabel,
  ariaLabel,
  errorMessage,
}: FmzPasswordInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{label}</label>
      <FmzPasswordField
        placeholder={placeholder}
        name={name}
        autoComplete={autoComplete}
        required
        aria-label={ariaLabel}
        aria-invalid={Boolean(errorMessage)}
        hasError={Boolean(errorMessage)}
        showLabel={showLabel}
        hideLabel={hideLabel}
      />
      <FmzFieldErrorMessage message={errorMessage} />
    </div>
  );
}
