/**
 * Formats a date value as DD/MM/YYYY for Brazilian display.
 *
 * Safe for:
 *  - YYYY-MM-DD ISO strings (date-only) — parsed as local date parts to avoid
 *    UTC midnight shifting the day in Brazilian time (UTC-3).
 *  - Full ISO datetime strings — parsed via Date constructor.
 *  - Date objects.
 *  - null/undefined — returns the fallback string (default '—').
 *  - Invalid dates — returns the original string or fallback.
 */
export function formatDateBR(
  value: string | Date | null | undefined,
  fallback = '—',
): string {
  if (!value) return fallback;

  let day: number;
  let month: number;
  let year: number;

  if (typeof value === 'string') {
    const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (isoDateOnly) {
      year = parseInt(isoDateOnly[1], 10);
      month = parseInt(isoDateOnly[2], 10);
      day = parseInt(isoDateOnly[3], 10);
    } else {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      day = d.getDate();
      month = d.getMonth() + 1;
      year = d.getFullYear();
    }
  } else {
    if (Number.isNaN(value.getTime())) return fallback;
    day = value.getDate();
    month = value.getMonth() + 1;
    year = value.getFullYear();
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}
