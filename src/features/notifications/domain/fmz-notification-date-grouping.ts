import type { NotificationDateBucket } from './fmz-notifications.types';

const TZ = 'America/Sao_Paulo';

function toSaoPauloDateString(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: TZ });
}

/**
 * Classifies a notification's createdAt into a display bucket.
 *
 * Buckets (relative to SP wall-clock "today"):
 *   'hoje'   — same calendar date as today
 *   'semana' — within the last 7 days (not today)
 *   'antes'  — older than 7 days
 *
 * Returns 'antes' for null / unparseable inputs.
 *
 * Time:  O(1)
 * Space: O(1)
 */
export function classifyNotificationDate(createdAt: string | null | undefined): NotificationDateBucket {
  if (!createdAt) return 'antes';

  const parsed = new Date(createdAt);
  if (isNaN(parsed.getTime())) return 'antes';

  const now       = new Date();
  const todayStr  = toSaoPauloDateString(now);
  const parsedStr = toSaoPauloDateString(parsed);

  if (parsedStr === todayStr) return 'hoje';

  const diffMs   = now.getTime() - parsed.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= 7 ? 'semana' : 'antes';
}

export const DATE_BUCKET_LABELS: Record<NotificationDateBucket, string> = {
  hoje:   'Hoje',
  semana: 'Esta semana',
  antes:  'Antes',
};

export const DATE_BUCKET_ORDER: NotificationDateBucket[] = ['hoje', 'semana', 'antes'];
