'use client';

import { useState } from 'react';
import { formatBirthdateInput } from '../../../services/phone-country-format';

type FmzBirthdateInputProps = {
  label: string;
  placeholder: string;
  ariaLabel: string;
};

export function FmzBirthdateInput({ label, placeholder, ariaLabel }: FmzBirthdateInputProps) {
  const [birthdate, setBirthdate] = useState('');

  return (
    <div>
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <input
        value={birthdate}
        onChange={(event) => setBirthdate(formatBirthdateInput(event.target.value))}
        type="text"
        inputMode="numeric"
        maxLength={10}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        name="birthdate"
        required
        aria-label={ariaLabel}
      />
    </div>
  );
}
