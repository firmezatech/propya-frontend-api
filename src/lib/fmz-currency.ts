/**
 * Formats a numeric value as Brazilian currency (R$ 1.234,56).
 *
 * Accepts numbers or numeric strings (the backend sometimes returns amounts as
 * strings). Falls back gracefully:
 *  - null/undefined or non-numeric input → returns the `fallback` string.
 *
 * @example formatCurrencyBRL(5375)      // "R$ 5.375,00"
 * @example formatCurrencyBRL("5375.5")  // "R$ 5.375,50"
 */
const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrencyBRL(
  value: number | string | null | undefined,
  fallback = '—',
): string {
  if (value === null || value === undefined || value === '') return fallback;

  const numeric = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(numeric)) return fallback;

  return brlFormatter.format(numeric);
}
