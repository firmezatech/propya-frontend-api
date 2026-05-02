'use client';

import { useMemo, useState } from 'react';

type FmzEmailInputProps = {
  label: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  autocompleteDomains: string[];
};

const MAX_EMAIL_AUTOCOMPLETE_OPTIONS = 4;

const getEmailAutocompleteOptions = (email: string, domains: string[]): string[] => {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.indexOf('@');

  if (atIndex <= 0) return [];

  const localPart = normalizedEmail.slice(0, atIndex);
  const domainPart = normalizedEmail.slice(atIndex + 1);

  if (!localPart) return [];

  return domains
    .filter((domain) => domain.startsWith(domainPart))
    .slice(0, MAX_EMAIL_AUTOCOMPLETE_OPTIONS)
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
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const emailAutocompleteOptions = useMemo(
    () => getEmailAutocompleteOptions(email, autocompleteDomains),
    [autocompleteDomains, email],
  );
  const shouldShowAutocomplete = isAutocompleteOpen && emailAutocompleteOptions.length > 0;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setIsAutocompleteOpen(value.includes('@'));
  };

  const handleEmailSuggestionSelect = (emailOption: string) => {
    setEmail(emailOption);
    setIsAutocompleteOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-left text-gray-700 font-medium">{label}</label>
      <input
        value={email}
        onChange={(event) => handleEmailChange(event.target.value)}
        onFocus={() => setIsAutocompleteOpen(email.includes('@'))}
        onBlur={() => setIsAutocompleteOpen(false)}
        type="email"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        name={name}
        autoComplete="email"
        required
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={shouldShowAutocomplete}
      />
      {shouldShowAutocomplete && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-left text-sm shadow-lg">
          {emailAutocompleteOptions.map((emailOption) => (
            <li key={emailOption}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-gray-700 transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleEmailSuggestionSelect(emailOption)}
              >
                {emailOption}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
