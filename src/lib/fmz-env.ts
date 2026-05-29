/**
 * Reads a NEXT_PUBLIC_ env var and returns its trimmed value,
 * or `fallback` if the var is absent or blank.
 */
export const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};
