'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import {
  buildFmzInternationalPhoneNumber,
  formatFmzPhoneNationalNumber,
  getDefaultFmzPhoneCountry,
  getEnabledFmzPhoneCountries,
  getFmzPhoneCountry,
  type FmzPhoneCountryCode,
} from '../../../lib/fmz-phone-country-format';
import { FmzSelect, FmzTextInput } from '../../../components/design-system';
import { FmzFieldErrorMessage } from '../../api-errors/components';

type FmzPhoneInputProps = {
  label: string;
  countryLabel: string;
  phoneAriaLabel: string;
  errorMessage?: string;
};

export function FmzPhoneInput({ label, countryLabel, phoneAriaLabel, errorMessage }: FmzPhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<FmzPhoneCountryCode>(getDefaultFmzPhoneCountry());
  const enabledPhoneCountries = useMemo(() => getEnabledFmzPhoneCountries(), []);
  const selectedPhoneCountry = getFmzPhoneCountry(phoneCountry);
  const internationalPhoneNumber = buildFmzInternationalPhoneNumber(phone, phoneCountry);

  const handlePhoneCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = event.target.value as FmzPhoneCountryCode;
    setPhoneCountry(selectedCountry);
    setPhone(formatFmzPhoneNationalNumber(phone, selectedCountry));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatFmzPhoneNationalNumber(event.target.value, phoneCountry));
  };

  return (
    <div className="space-y-2">
      <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{label}</label>
      <div className="flex gap-2">
        <FmzSelect
          name="phoneCountry"
          value={phoneCountry}
          onChange={handlePhoneCountryChange}
          className="w-32 shrink-0"
          aria-label={countryLabel}
          hasError={Boolean(errorMessage)}
        >
          {enabledPhoneCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.dialCode} {country.code}
            </option>
          ))}
        </FmzSelect>
        <FmzTextInput
          value={phone}
          onChange={handlePhoneChange}
          type="tel"
          inputMode="tel"
          placeholder={selectedPhoneCountry.placeholder}
          name="phoneNational"
          required
          aria-label={phoneAriaLabel}
          aria-invalid={Boolean(errorMessage)}
          hasError={Boolean(errorMessage)}
        />
      </div>
      <input type="hidden" name="phone" value={internationalPhoneNumber} />
      <FmzFieldErrorMessage message={errorMessage} />
    </div>
  );
}
