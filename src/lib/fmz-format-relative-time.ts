/**
 * Converts an ISO date string to a human-readable relative time label in pt-BR.
 *
 * Returns:
 *   - ""         for null, undefined, or unparseable values
 *   - "agora"    for timestamps less than 1 minute ago
 *   - "há N min" for timestamps N minutes ago (1 ≤ N < 60)
 *   - "há Nh"    for timestamps N hours ago   (1 ≤ N < 24)
 *   - "há N dia" / "há N dias" for timestamps N days ago
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const parsed = new Date(isoString);
    if (isNaN(parsed.getTime())) return '';
    const diff = Date.now() - parsed.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  } catch {
    return '';
  }
}
