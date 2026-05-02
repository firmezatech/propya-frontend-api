import axios, { type AxiosError } from 'axios';
import { FMZ_API_ERROR_CODES, type FmzApiErrorCode } from './fmz-api-error-codes';
import {
  FMZ_API_ERROR_MESSAGES_PT_BR,
  FMZ_DEFAULT_API_ERROR_MESSAGE,
  FMZ_SERVER_API_ERROR_MESSAGE,
  type FmzApiErrorMessage,
} from './fmz-api-error-translations';

export type FmzFieldErrorMap = Partial<Record<NonNullable<FmzApiErrorMessage['field']>, string>>;

export type FmzNormalizedApiError = FmzApiErrorMessage & {
  code: FmzApiErrorCode;
  statusCode?: number;
  fieldErrors: FmzFieldErrorMap;
};

type BackendErrorDetail = {
  field?: string;
  path?: string;
  code?: string;
  message?: string;
};

type BackendErrorDetails = BackendErrorDetail[] | Record<string, unknown> | string | null | undefined;

type BackendErrorResponse = {
  success?: boolean;
  msg?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: BackendErrorDetails;
  };
};

const fieldNameMap: Record<string, keyof FmzFieldErrorMap> = Object.freeze({
  email: 'email',
  password: 'password',
  currentPassword: 'password',
  newPassword: 'password',
  confirmPassword: 'confirmPassword',
  phone: 'phone',
  phoneNumber: 'phone',
  birthdate: 'birthdate',
  birthDate: 'birthdate',
  name: 'name',
});

const errorMessageLookup: Record<string, FmzApiErrorMessage> = FMZ_API_ERROR_MESSAGES_PT_BR;

const isKnownFmzApiErrorCode = (code: string | undefined): code is FmzApiErrorCode => (
  Boolean(code && errorMessageLookup[code])
);

const getLegacyCodeFromMessage = (message: string | undefined): FmzApiErrorCode | undefined => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (!normalizedMessage) return undefined;
  if (normalizedMessage.includes('email') && normalizedMessage.includes('already')) return FMZ_API_ERROR_CODES.EMAIL_ALREADY_EXISTS;
  if (normalizedMessage.includes('email') && normalizedMessage.includes('not found')) return FMZ_API_ERROR_CODES.EMAIL_NOT_FOUND;
  if (normalizedMessage.includes('invalid') && normalizedMessage.includes('email')) return FMZ_API_ERROR_CODES.INVALID_EMAIL;
  if (normalizedMessage.includes('invalid') && normalizedMessage.includes('credentials')) return FMZ_API_ERROR_CODES.INVALID_CREDENTIALS;
  if (normalizedMessage.includes('all fields') || normalizedMessage.includes('required')) return FMZ_API_ERROR_CODES.REQUIRED_FIELD_MISSING;

  return undefined;
};

const getSafeCode = (statusCode: number | undefined, errorResponse?: BackendErrorResponse): FmzApiErrorCode => {
  if (statusCode && statusCode >= 500) return FMZ_API_ERROR_CODES.INTERNAL_SERVER_ERROR;

  const backendCode = errorResponse?.error?.code;
  if (isKnownFmzApiErrorCode(backendCode)) return backendCode;

  const legacyCode = getLegacyCodeFromMessage(errorResponse?.msg || errorResponse?.message || errorResponse?.error?.message);
  if (legacyCode) return legacyCode;

  if (statusCode === 401) return FMZ_API_ERROR_CODES.UNAUTHORIZED;
  if (statusCode === 403) return FMZ_API_ERROR_CODES.FORBIDDEN;

  return FMZ_API_ERROR_CODES.UNKNOWN_ERROR;
};

const buildFieldErrors = (message: FmzApiErrorMessage, details: BackendErrorDetails): FmzFieldErrorMap => {
  const fieldErrors: FmzFieldErrorMap = {};

  if (message.field) {
    fieldErrors[message.field] = message.description;
  }

  if (Array.isArray(details)) {
    details.forEach((detail) => {
      const backendField = fieldNameMap[String(detail.field || detail.path || '')];
      if (!backendField) return;
      fieldErrors[backendField] = message.description;
    });
  }

  return fieldErrors;
};

export const normalizeFmzApiError = (error: unknown): FmzNormalizedApiError => {
  if (!axios.isAxiosError(error)) {
    return {
      ...FMZ_DEFAULT_API_ERROR_MESSAGE,
      code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
      fieldErrors: {},
    };
  }

  const axiosError = error as AxiosError<BackendErrorResponse>;
  const statusCode = axiosError.response?.status;
  const errorResponse = axiosError.response?.data;
  const code = getSafeCode(statusCode, errorResponse);
  const baseMessage = statusCode && statusCode >= 500
    ? FMZ_SERVER_API_ERROR_MESSAGE
    : errorMessageLookup[code] || FMZ_DEFAULT_API_ERROR_MESSAGE;

  return {
    ...baseMessage,
    code,
    statusCode,
    fieldErrors: buildFieldErrors(baseMessage, errorResponse?.error?.details),
  };
};
