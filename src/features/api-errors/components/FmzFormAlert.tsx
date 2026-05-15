'use client';

import { AlertTriangle, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type { FmzNormalizedApiError } from '../domain/fmz-api-error-normalizer';

type FmzFormAlertProps = {
  error?: FmzNormalizedApiError | null;
};

export function FmzFormAlert({ error }: FmzFormAlertProps) {
  if (!error) return null;

  const isWarning = error.severity === 'warning';

  return (
    <div
      className={fmzCn(
        'mb-6 flex items-start gap-3 rounded-[10px] border border-l-[3px] px-4 py-3.5 animate-[fmzSlideDown_0.25s_ease]',
        isWarning
          ? 'border-[#F5E0A0] border-l-[#C97B10] bg-[#FFFBF0]'
          : 'border-[#F5C4BF] border-l-[#D94F3D] bg-[#FEF5F4]',
      )}
      role="alert"
      aria-live="polite"
    >
      <span
        className={fmzCn(
          'mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white',
          isWarning ? 'bg-[#C97B10]' : 'bg-[#D94F3D]',
        )}
      >
        {isWarning ? <AlertTriangle className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
      </span>
      <span className="flex-1">
        <strong className={fmzCn('mb-0.5 block font-syne text-[13px] font-bold', isWarning ? 'text-[#C97B10]' : 'text-[#D94F3D]')}>
          {error.title}
        </strong>
        <span className={fmzCn('block text-[13px] leading-5', isWarning ? 'text-[#7A4D10]' : 'text-[#7A3028]')}>
          {error.description}
        </span>
      </span>
    </div>
  );
}
