'use client';

import { useMemo } from 'react';
import {
  formatFmzPhoneNationalNumber,
  getFmzPhoneCountry,
  type FmzPhoneCountryCode,
} from '../../../lib/fmz-phone-country-format';
import { resolveFmzCountryPhone, type FmzCountryPhone } from '../../../lib/fmz-country-phone-data';
import { FmzCountryPhoneSelect } from '../../../components/design-system';
import styles from './FmzAccountPage.module.css';

type AccountPhoneInputProps = {
  phone: string;
  phoneCountry: string;
  onPhoneChange: (nationalNumber: string, countryCode: string) => void;
};

// Only the countries the formatting lib knows (BR/US/PT) get a national mask.
// getFmzPhoneCountry returns the default country for unknown codes, so an exact
// code match means the lib has a real mask for it.
const hasNationalMask = (iso2: string): iso2 is FmzPhoneCountryCode => getFmzPhoneCountry(iso2).code === iso2;

const formatNationalNumber = (value: string, iso2: string): string =>
  hasNationalMask(iso2) ? formatFmzPhoneNationalNumber(value, iso2) : value.replace(/\D/g, '').slice(0, 15);

const placeholderFor = (country: FmzCountryPhone): string =>
  hasNationalMask(country.iso2) ? getFmzPhoneCountry(country.iso2).placeholder : 'Número de telefone';

const extractNationalNumber = (phone: string, country: FmzCountryPhone): string => {
  const withoutDialCode = phone.startsWith(country.dialCode) ? phone.slice(country.dialCode.length).trim() : phone;
  return formatNationalNumber(withoutDialCode, country.iso2);
};

export function FmzAccountPhoneInput({ phone, phoneCountry, onPhoneChange }: AccountPhoneInputProps) {
  const activeCountry = useMemo(() => resolveFmzCountryPhone(phoneCountry), [phoneCountry]);
  const nationalNumber = useMemo(() => extractNationalNumber(phone, activeCountry), [phone, activeCountry]);

  const handleCountrySelect = (country: FmzCountryPhone) => {
    onPhoneChange(formatNationalNumber(nationalNumber, country.iso2), country.iso2);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPhoneChange(formatNationalNumber(event.target.value, activeCountry.iso2), activeCountry.iso2);
  };

  return (
    <div className={styles.phoneRow}>
      <FmzCountryPhoneSelect value={activeCountry.iso2} onChange={handleCountrySelect} ariaLabel="Código do país" />
      <div className={`${styles.fieldInput} ${styles.phoneNumberInput}`}>
        <input
          type="tel"
          inputMode="tel"
          value={nationalNumber}
          placeholder={placeholderFor(activeCountry)}
          onChange={handleNumberChange}
          aria-label="Número de telefone"
        />
      </div>
    </div>
  );
}
