'use client';

import { useState } from 'react';
import { formatBirthdateInput } from '../../../services/phone-country-format';
import { FmzTextInput } from '../../../components/design-system';

type FmzBirthdateInputProps = {
  label: string;
  placeholder: string;
  ariaLabel: string;
};

export function FmzBirthdateInput({ label, placeholder, ariaLabel }: FmzBirthdateInputProps) {
  const [birthdate, setBirthdate] = useState('');

  return (
    <div className="space-y-2">
      <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{label}</label>
      <FmzTextInput
        value={birthdate}
        onChange={(event) => setBirthdate(formatBirthdateInput(event.target.value))}
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        name="birthdate"
        required
        aria-label={ariaLabel}
      />
    </div>
  );
}
