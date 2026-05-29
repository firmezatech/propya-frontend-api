import type { FmzNormalizedApiError } from './fmz-api-error-normalizer';

type FmzApiSuccess<T> = T & {
  success: true;
  message: string;
};

type FmzApiFailure = {
  success: false;
  error: FmzNormalizedApiError;
};

export type FmzApiResult<T> = FmzApiSuccess<T> | FmzApiFailure;
