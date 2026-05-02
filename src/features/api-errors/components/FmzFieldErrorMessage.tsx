'use client';

import { AlertCircle } from 'lucide-react';

type FmzFieldErrorMessageProps = {
  message?: string;
};

export function FmzFieldErrorMessage({ message }: FmzFieldErrorMessageProps) {
  if (!message) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-left text-[12.5px] leading-5 text-[#D94F3D] animate-[fmzFadeIn_0.2s_ease]">
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
