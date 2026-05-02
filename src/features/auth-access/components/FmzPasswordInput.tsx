'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FmzButton, FmzTextInput } from '../../../components/design-system';
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const toggleLabel = isPasswordVisible ? hideLabel : showLabel;
  const PasswordVisibilityIcon = isPasswordVisible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{label}</label>
      <div className="relative">
        <FmzTextInput
          type={isPasswordVisible ? 'text' : 'password'}
          className="pr-14"
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          required
          aria-label={ariaLabel}
          aria-invalid={Boolean(errorMessage)}
          hasError={Boolean(errorMessage)}
        />
        <FmzButton
          variant="icon"
          type="button"
          onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <PasswordVisibilityIcon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </FmzButton>
      </div>
      <FmzFieldErrorMessage message={errorMessage} />
    </div>
  );
}
