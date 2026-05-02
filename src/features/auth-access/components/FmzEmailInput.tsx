'use client';

import { useMemo, useState } from 'react';

type FmzEmailInputProps = {
  label: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  autocompleteDomains: string[];
};

const getEmailAutocompleteOptions = (email: string, domains: string[]): string[] => {
  const [localPart, domainPart = ''] = email.toLowerCase().split('@');
  if (!localPart || !email.includes('@')) return [];

  return domains
    .filter((domain) => domain.startsWith(domainPart))
    .map((domain) => `${localPart}@${domain}`);
};

export function FmzEmailInput({
  label,
  name,
  placeholder,
  ariaLabel,
  autocompleteDomains,
}: FmzEmailInputProps) {
  const [email, setEmail] = useState('');
  const autocompleteId = `${name}-autocomplete-options`;
  const emailAutocompleteOptions = useMemo(
    () => getEmailAutocompleteOptions(email, autocompleteDomains),
    [autocompleteDomains, email],
  );

  return (
    <div>
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        name={name}
        autoComplete="email"
        list={autocompleteId}
        required
        aria-label={ariaLabel}
      />
      <datalist id={autocompleteId}>
        {emailAutocompleteOptions.map((emailOption) => (
          <option key={emailOption} value={emailOption} />
        ))}
      </datalist>
    </div>
  );
}
