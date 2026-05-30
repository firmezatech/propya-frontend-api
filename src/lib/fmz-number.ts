// Safe numeric coercion helpers.
//
// Guard against `Number(object)` → NaN and against `Number('')` → 0. Only genuine
// finite numbers (or numeric strings, including comma decimals like "1,5") are
// accepted; everything else is rejected. Centralised here so the token-purchase
// quote/seed logic and the boleto normaliser share one definition instead of each
// carrying a slightly different copy.

/** Parses a value into a finite number, or `undefined` when it isn't numeric. */
export function toFiniteNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Parses a value into a finite number, falling back to `fallback` (default 0). */
export function toFiniteNumber(value: unknown, fallback = 0): number {
  return toFiniteNumberOrUndefined(value) ?? fallback;
}

/** First argument that parses to a finite number, or `undefined` if none do. */
export function firstFiniteNumberOrUndefined(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = toFiniteNumberOrUndefined(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

/** First argument that parses to a finite number, falling back to `fallback` (default 0). */
export function firstFiniteNumber(...values: unknown[]): number {
  return firstFiniteNumberOrUndefined(...values) ?? 0;
}
