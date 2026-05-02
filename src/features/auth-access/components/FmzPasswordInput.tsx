'use client';

import { useState } from 'react';

type FmzPasswordInputProps = {
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
  ariaLabel: string;
};

export function FmzPasswordInput({
  label,
  name,
  placeholder,
  autoComplete,
  showLabel,
  hideLabel,
  ariaLabel,
}: FmzPasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const toggleLabel = isPasswordVisible ? hideLabel : showLabel;

  return (
    <div>
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <div className="relative">
        <input
          type={isPasswordVisible ? 'text' : 'password'}
          className="w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          required
          aria-label={ariaLabel}
        />
        <button
          type="button"
          onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
          className="absolute inset-y-0 right-3 text-sm text-blue-600 hover:underline"
          aria-label={toggleLabel}
        >
          {toggleLabel}
        </button>
      </div>
    </div>
  );
}
