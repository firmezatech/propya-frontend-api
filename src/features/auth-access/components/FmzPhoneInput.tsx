'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import {
  buildFmzInternationalPhoneNumber,
  formatFmzPhoneNationalNumber,
  getDefaultFmzPhoneCountry,
  getEnabledFmzPhoneCountries,
  getFmzPhoneCountry,
  type FmzPhoneCountryCode,
} from '../../../services/phone-country-format';

type FmzPhoneInputProps = {
  label: string;
  countryLabel: string;
  phoneAriaLabel: string;
};

export function FmzPhoneInput({ label, countryLabel, phoneAriaLabel }: FmzPhoneInputProps) {
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
    <div>
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <div className="flex gap-2">
        <select
          name="phoneCountry"
          value={phoneCountry}
          onChange={handlePhoneCountryChange}
          className="w-36 px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={countryLabel}
        >
          {enabledPhoneCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.dialCode} {country.code}
            </option>
          ))}
        </select>
        <input
          value={phone}
          onChange={handlePhoneChange}
          type="tel"
          inputMode="tel"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={selectedPhoneCountry.placeholder}
          name="phoneNational"
          required
          aria-label={phoneAriaLabel}
        />
      </div>
      <input type="hidden" name="phone" value={internationalPhoneNumber} />
    </div>
  );
}
