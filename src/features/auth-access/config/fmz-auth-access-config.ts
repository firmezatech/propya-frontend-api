const DEFAULT_MINIMUM_REGISTRATION_AGE = 18;

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const parseCommaSeparatedValues = (value: string | undefined): string[] => (
  value
    ?.split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean) ?? []
);

export type FmzAuthAccessConfig = {
  minimumRegistrationAge: number;
  emailAutocompleteDomains: string[];
};

export const getFmzAuthAccessConfig = (): FmzAuthAccessConfig => ({
  minimumRegistrationAge: parsePositiveInteger(
    process.env.NEXT_PUBLIC_FMZ_MINIMUM_REGISTRATION_AGE,
    DEFAULT_MINIMUM_REGISTRATION_AGE,
  ),
  emailAutocompleteDomains: parseCommaSeparatedValues(
    process.env.NEXT_PUBLIC_FMZ_EMAIL_AUTOCOMPLETE_DOMAINS,
  ),
});
