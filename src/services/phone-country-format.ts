export type FmzPhoneCountryCode = 'BR' | 'US' | 'PT';

export type FmzPhoneCountry = {
  code: FmzPhoneCountryCode;
  label: string;
  dialCode: string;
  placeholder: string;
  maxDigits: number;
};

const FMZ_PHONE_COUNTRY_BY_CODE: Record<FmzPhoneCountryCode, FmzPhoneCountry> = {
  BR: { code: 'BR', label: 'Brasil', dialCode: '+55', placeholder: '(11) 11111-1111', maxDigits: 11 },
  US: { code: 'US', label: 'United States', dialCode: '+1', placeholder: '(111) 111-1111', maxDigits: 10 },
  PT: { code: 'PT', label: 'Portugal', dialCode: '+351', placeholder: '111 111 111', maxDigits: 9 },
};

const DEFAULT_ENABLED_PHONE_COUNTRIES: FmzPhoneCountryCode[] = ['BR', 'US', 'PT'];
const DEFAULT_PHONE_COUNTRY: FmzPhoneCountryCode = 'BR';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const isFmzPhoneCountryCode = (value: string): value is FmzPhoneCountryCode =>
  Object.prototype.hasOwnProperty.call(FMZ_PHONE_COUNTRY_BY_CODE, value);

export const getEnabledFmzPhoneCountries = (): FmzPhoneCountry[] => {
  const configuredCountries = process.env.NEXT_PUBLIC_FMZ_ENABLED_PHONE_COUNTRIES
    ?.split(',')
    .map((countryCode) => countryCode.trim().toUpperCase())
    .filter(isFmzPhoneCountryCode);

  const enabledCountryCodes = configuredCountries?.length
    ? configuredCountries
    : DEFAULT_ENABLED_PHONE_COUNTRIES;

  return enabledCountryCodes.map((countryCode) => FMZ_PHONE_COUNTRY_BY_CODE[countryCode]);
};

export const getDefaultFmzPhoneCountry = (): FmzPhoneCountryCode => {
  const configuredCountry = process.env.NEXT_PUBLIC_FMZ_DEFAULT_PHONE_COUNTRY?.trim().toUpperCase();

  if (configuredCountry && isFmzPhoneCountryCode(configuredCountry)) {
    return configuredCountry;
  }

  return DEFAULT_PHONE_COUNTRY;
};

export const getFmzPhoneCountry = (countryCode: string): FmzPhoneCountry => {
  if (isFmzPhoneCountryCode(countryCode)) {
    return FMZ_PHONE_COUNTRY_BY_CODE[countryCode];
  }

  return FMZ_PHONE_COUNTRY_BY_CODE[DEFAULT_PHONE_COUNTRY];
};

export const formatBirthdateInput = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const formatFmzPhoneNationalNumber = (value: string, countryCode: FmzPhoneCountryCode): string => {
  const country = getFmzPhoneCountry(countryCode);
  const digits = onlyDigits(value).slice(0, country.maxDigits);

  if (countryCode === 'BR') {
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (countryCode === 'US') {
    if (digits.length <= 3) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export const buildFmzInternationalPhoneNumber = (
  nationalPhoneNumber: string,
  countryCode: FmzPhoneCountryCode,
): string => {
  const country = getFmzPhoneCountry(countryCode);
  const formattedNationalPhoneNumber = formatFmzPhoneNationalNumber(nationalPhoneNumber, countryCode);
  return formattedNationalPhoneNumber ? `${country.dialCode} ${formattedNationalPhoneNumber}` : '';
};

export const isValidFmzPhoneNumber = (nationalPhoneNumber: string, countryCode: FmzPhoneCountryCode): boolean => {
  const digits = onlyDigits(nationalPhoneNumber);
  if (countryCode === 'BR') return digits.length === 10 || digits.length === 11;
  if (countryCode === 'US') return digits.length === 10;
  if (countryCode === 'PT') return digits.length === 9;
  return false;
};
