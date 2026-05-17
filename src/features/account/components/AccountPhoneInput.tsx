'use client';

import { ChevronDown, Phone } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatFmzPhoneNationalNumber,
  getDefaultFmzPhoneCountry,
  getEnabledFmzPhoneCountries,
  getFmzPhoneCountry,
  type FmzPhoneCountryCode,
} from '../../../services/phone-country-format';
import styles from './FmzAccountPage.module.css';

type AccountPhoneInputProps = {
  phone: string;
  phoneCountry: string;
  onPhoneChange: (nationalNumber: string, countryCode: FmzPhoneCountryCode) => void;
};

const resolveCountryCode = (value: string): FmzPhoneCountryCode => {
  const enabled = getEnabledFmzPhoneCountries();
  const match = enabled.find((c) => c.code === value.trim().toUpperCase());
  return match ? match.code : getDefaultFmzPhoneCountry();
};

const extractNationalNumber = (phone: string, countryCode: FmzPhoneCountryCode): string => {
  const country = getFmzPhoneCountry(countryCode);
  const withoutDialCode = phone.startsWith(country.dialCode)
    ? phone.slice(country.dialCode.length).trim()
    : phone;
  return formatFmzPhoneNationalNumber(withoutDialCode, countryCode);
};

export function AccountPhoneInput({ phone, phoneCountry, onPhoneChange }: AccountPhoneInputProps) {
  const enabledCountries = useMemo(() => getEnabledFmzPhoneCountries(), []);
  const activeCode = resolveCountryCode(phoneCountry);
  const activeCountry = getFmzPhoneCountry(activeCode);
  const nationalNumber = useMemo(
    () => extractNationalNumber(phone, activeCode),
    [phone, activeCode],
  );

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCode = event.target.value as FmzPhoneCountryCode;
    const reformatted = formatFmzPhoneNationalNumber(nationalNumber, nextCode);
    onPhoneChange(reformatted, nextCode);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFmzPhoneNationalNumber(event.target.value, activeCode);
    onPhoneChange(formatted, activeCode);
  };

  return (
    <div className={styles.phoneRow}>
      <div className={`${styles.fieldInput} ${styles.phoneCountrySelect}`}>
        <Phone className={styles.iconLeft} aria-hidden="true" />
        <select
          value={activeCode}
          onChange={handleCountryChange}
          aria-label="Código do país"
          className={styles.hasIcon}
        >
          {enabledCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.dialCode} {c.code}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.selectIcon} aria-hidden="true" />
      </div>
      <div className={`${styles.fieldInput} ${styles.phoneNumberInput}`}>
        <input
          type="tel"
          inputMode="tel"
          value={nationalNumber}
          placeholder={activeCountry.placeholder}
          onChange={handleNumberChange}
          aria-label="Número de telefone"
        />
      </div>
    </div>
  );
}
