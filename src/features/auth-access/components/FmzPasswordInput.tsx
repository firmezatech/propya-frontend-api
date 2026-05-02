'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const PasswordVisibilityIcon = isPasswordVisible ? EyeOff : Eye;

  return (
    <div>
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <div className="relative">
        <input
          type={isPasswordVisible ? 'text' : 'password'}
          className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          required
          aria-label={ariaLabel}
        />
        <button
          type="button"
          onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
          className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 transition hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <PasswordVisibilityIcon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
