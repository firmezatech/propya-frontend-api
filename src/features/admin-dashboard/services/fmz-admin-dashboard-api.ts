import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzAdminDashboardOverview,
  FmzAdminActivityEvent,
  FmzActivityEventType,
} from '../domain/fmz-admin-dashboard.types';

// ─── Primitive coercions ──────────────────────────────────────────────────────

const coerceString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const coerceNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const coerceBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const coerceArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

// ─── Activity event type guard ────────────────────────────────────────────────

const VALID_EVENT_TYPES = new Set<FmzActivityEventType>([
  'token_purchase',
  'user_signup',
  'invoice_generated',
  'refund_approved',
  'property_added',
]);

const toEventType = (value: unknown): FmzActivityEventType => {
  const candidate = coerceString(value);
  return VALID_EVENT_TYPES.has(candidate as FmzActivityEventType)
    ? (candidate as FmzActivityEventType)
    : 'token_purchase';
};

// ─── Overview normalizer ──────────────────────────────────────────────────────

const normalizeOverview = (raw: unknown): FmzAdminDashboardOverview => {
  const body     = recordOf(raw);
  const metrics  = recordOf(body.metrics);
  const users    = recordOf(metrics.users);
  const tokens   = recordOf(metrics.tokens);
  const invoices = recordOf(metrics.invoices);
  const props    = recordOf(metrics.properties);

  return {
    metrics: {
      users: {
        total:     coerceNumber(users.total),
        thisMonth: coerceNumber(users.thisMonth),
        lastMonth: coerceNumber(users.lastMonth),
      },
      tokens: {
        volumeTotal: coerceNumber(tokens.volumeTotal),
        unit:        coerceString(tokens.unit, 'FRMZ'),
        thisMonth:   coerceNumber(tokens.thisMonth),
        lastMonth:   coerceNumber(tokens.lastMonth),
      },
      invoices: {
        volumeThisMonthBrl:          coerceString(invoices.volumeThisMonthBrl, '0'),
        volumeLastMonthBrl:          coerceString(invoices.volumeLastMonthBrl, '0'),
        percentageChangeVsLastMonth: coerceNumber(invoices.percentageChangeVsLastMonth),
      },
      properties: {
        total:     coerceNumber(props.total),
        available: coerceNumber(props.available),
      },
      pendingBoletos:     coerceNumber(metrics.pendingBoletos),
      metricsRefreshedAt: coerceString(metrics.metricsRefreshedAt),
    },
    topProperties: coerceArray<unknown>(body.topProperties).map((property) => {
      const row = recordOf(property);
      return {
        id:            coerceString(row.id),
        address:       coerceString(row.address),
        neighborhood:  coerceString(row.neighborhood),
        coOwnersCount: coerceNumber(row.coOwnersCount),
        isOccupied:    coerceBoolean(row.isOccupied),
      };
    }),
  };
};

// ─── Activity normalizer ──────────────────────────────────────────────────────

const normalizeEvent = (raw: unknown): FmzAdminActivityEvent => {
  const row = recordOf(raw);
  return {
    id:        coerceString(row.id),
    eventType: toEventType(row.eventType),
    actorName: typeof row.actorName === 'string' ? row.actorName : undefined,
    title:     coerceString(row.title),
    subtitle:  typeof row.subtitle === 'string' ? row.subtitle : undefined,
    relatedId: typeof row.relatedId === 'string' ? row.relatedId : undefined,
    createdAt: coerceString(row.createdAt),
  };
};

// ─── Fetch functions ──────────────────────────────────────────────────────────

export const fetchAdminDashboardOverview = async (): Promise<FmzAdminDashboardOverview> => {
  try {
    const { data } = await firmezaApiClient.get('/admin/dashboard/overview');
    return normalizeOverview(data);
  } catch (error) {
    throw new Error('fetchAdminDashboardOverview failed', { cause: error });
  }
};

export const fetchAdminActivityFeed = async (
  limit = 5,
): Promise<FmzAdminActivityEvent[]> => {
  try {
    const { data } = await firmezaApiClient.get(
      `/admin/dashboard/activity?limit=${limit}&offset=0`,
    );
    const body = recordOf(data);
    return coerceArray<unknown>(body.events).map(normalizeEvent);
  } catch (error) {
    throw new Error('fetchAdminActivityFeed failed', { cause: error });
  }
};
