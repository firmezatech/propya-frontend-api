/**
 * Prepends the active locale to a relative href when a locale is present.
 *
 * Examples:
 *   buildFmzLocalizedHref('pt', '/connected/dashboard') → '/pt/connected/dashboard'
 *   buildFmzLocalizedHref(undefined, '/connected/dashboard') → '/connected/dashboard'
 */
export function buildFmzLocalizedHref(
  locale: string | undefined,
  href: string,
): string {
  return locale ? `/${locale}${href}` : href;
}
