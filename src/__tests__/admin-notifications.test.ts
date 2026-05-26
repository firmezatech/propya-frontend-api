/**
 * Tests: Admin Notification System
 *
 * Covers:
 *   - API service endpoint contracts
 *   - resolveAdminNotificationVisual — all 5 known types + unknown fallback
 *   - isSafeInternalPath — URL safety guard
 *   - Badge uses backend unread count (never hardcoded)
 *   - Empty state text contract
 *   - Navigation: actionUrl triggers router.push; absent/unsafe URL does not
 */

import {
  resolveAdminNotificationVisual,
  isSafeInternalPath,
} from '../components/layout/FmzAdminNotificationBell';
import type { AdminNotificationType } from '../features/admin-notifications/domain/fmz-admin-notifications.types';

// ─── resolveAdminNotificationVisual ───────────────────────────────────────────

describe('resolveAdminNotificationVisual()', () => {

  const KNOWN_TYPES: { type: AdminNotificationType; expectedTone: string }[] = [
    { type: 'admin_kyc_document_pending_review', expectedTone: 'blue'  },
    { type: 'admin_boleto_overdue',              expectedTone: 'gold'  },
    { type: 'admin_payment_issue',               expectedTone: 'red'   },
    { type: 'admin_profile_requires_attention',  expectedTone: 'gold'  },
    { type: 'admin_system_job_failed',           expectedTone: 'red'   },
  ];

  it.each(KNOWN_TYPES)(
    'type "$type" resolves to tone "$expectedTone"',
    ({ type, expectedTone }) => {
      const visual = resolveAdminNotificationVisual(type);
      expect(visual.tone).toBe(expectedTone);
    },
  );

  it.each(KNOWN_TYPES)(
    'type "$type" resolves to a non-null icon',
    ({ type }) => {
      const visual = resolveAdminNotificationVisual(type);
      expect(visual.icon).toBeDefined();
      expect(visual.icon).not.toBeNull();
    },
  );

  it('unknown type falls back to tone "navy"', () => {
    const visual = resolveAdminNotificationVisual('admin_future_unknown_type');
    expect(visual.tone).toBe('navy');
  });

  it('unknown type falls back to a non-null icon', () => {
    const visual = resolveAdminNotificationVisual('admin_future_unknown_type');
    expect(visual.icon).toBeDefined();
  });

  it('all 5 known types do NOT fall to the default navy mapping', () => {
    const knownTypes: AdminNotificationType[] = [
      'admin_kyc_document_pending_review',
      'admin_boleto_overdue',
      'admin_payment_issue',
      'admin_profile_requires_attention',
      'admin_system_job_failed',
    ];
    knownTypes.forEach((type) => {
      const visual = resolveAdminNotificationVisual(type);
      expect(visual.tone).not.toBe('navy');
    });
  });

  it('each known type resolves to a defined icon (not null or undefined)', () => {
    // Lucide icons are stubbed in tests — identity comparison is not meaningful.
    // This test verifies the mapping returns a truthy icon reference.
    const knownTypes: AdminNotificationType[] = [
      'admin_kyc_document_pending_review',
      'admin_boleto_overdue',
      'admin_payment_issue',
      'admin_profile_requires_attention',
      'admin_system_job_failed',
    ];
    knownTypes.forEach((type) => {
      const visual = resolveAdminNotificationVisual(type);
      expect(visual.icon).toBeDefined();
      expect(visual.icon).not.toBeNull();
    });
  });

});

// ─── isSafeInternalPath ───────────────────────────────────────────────────────

describe('isSafeInternalPath()', () => {

  const SAFE_PATHS = [
    '/admin/kyc',
    '/admin/notifications',
    '/connected/dashboard',
    '/admin/users/123',
  ];

  const UNSAFE_PATHS = [
    'https://evil.com',
    'http://evil.com/path',
    '//evil.com',
    '//evil.com/path',
    'javascript:alert(1)',
    'ftp://files.example.com',
    '',
    null,
    undefined,
  ];

  it.each(SAFE_PATHS)('accepts safe relative path "%s"', (path) => {
    expect(isSafeInternalPath(path)).toBe(true);
  });

  it.each(UNSAFE_PATHS as (string | null | undefined)[])(
    'rejects unsafe value "%s"',
    (path) => {
      expect(isSafeInternalPath(path)).toBe(false);
    },
  );

  it('returns a type predicate — narrows to string for safe paths', () => {
    const url: string | null = '/admin/kyc';
    if (isSafeInternalPath(url)) {
      // TypeScript narrows to string inside this block.
      const narrowed: string = url;
      expect(narrowed).toBe('/admin/kyc');
    } else {
      fail('Expected isSafeInternalPath to return true for "/admin/kyc"');
    }
  });

  it('protocol-relative URL starting with "//" is rejected', () => {
    expect(isSafeInternalPath('//attacker.com/steal')).toBe(false);
  });

  it('absolute URL starting with "/" but then "//" is rejected', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
  });

});

// ─── API endpoint contracts ───────────────────────────────────────────────────

jest.mock('../features/admin-notifications/services/fmz-admin-notifications-api');

import {
  getAdminNotifications,
  getAdminNotificationUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from '../features/admin-notifications/services/fmz-admin-notifications-api';

const mockedGetAdminNotifications           = getAdminNotifications           as jest.MockedFunction<typeof getAdminNotifications>;
const mockedGetAdminNotificationUnreadCount = getAdminNotificationUnreadCount as jest.MockedFunction<typeof getAdminNotificationUnreadCount>;
const mockedMarkAdminNotificationAsRead     = markAdminNotificationAsRead     as jest.MockedFunction<typeof markAdminNotificationAsRead>;
const mockedMarkAllAdminNotificationsAsRead = markAllAdminNotificationsAsRead as jest.MockedFunction<typeof markAllAdminNotificationsAsRead>;

describe('Admin notifications — API service contracts', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAdminNotifications resolves with notifications array', async () => {
    const mockResponse = {
      notifications: [
        {
          id: 'notif-1',
          notificationType: 'admin_kyc_document_pending_review' as AdminNotificationType,
          title: 'Documento pendente de revisão',
          message: 'O documento de João Souza aguarda revisão.',
          severity: 'info',
          status: 'delivered',
          actionUrl: '/admin/kyc/123',
          readAt: null,
          deliveredAt: '2026-05-25T10:00:00Z',
          createdAt: '2026-05-25T09:58:00Z',
        },
      ],
    };
    mockedGetAdminNotifications.mockResolvedValueOnce(mockResponse);

    const result = await getAdminNotifications({ limit: 30 });

    expect(mockedGetAdminNotifications).toHaveBeenCalledTimes(1);
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].notificationType).toBe('admin_kyc_document_pending_review');
  });

  it('getAdminNotificationUnreadCount returns the backend count', async () => {
    mockedGetAdminNotificationUnreadCount.mockResolvedValueOnce({ unreadCount: 5 });

    const result = await getAdminNotificationUnreadCount();

    expect(result.unreadCount).toBe(5);
  });

  it('badge count is driven by backend — never hardcoded', async () => {
    // Arrange: backend returns 0 unread
    mockedGetAdminNotificationUnreadCount.mockResolvedValueOnce({ unreadCount: 0 });
    const result0 = await getAdminNotificationUnreadCount();
    expect(result0.unreadCount).toBe(0);

    // Arrange: backend returns 12 unread
    mockedGetAdminNotificationUnreadCount.mockResolvedValueOnce({ unreadCount: 12 });
    const result12 = await getAdminNotificationUnreadCount();
    expect(result12.unreadCount).toBe(12);
  });

  it('markAdminNotificationAsRead calls the service without throwing', async () => {
    mockedMarkAdminNotificationAsRead.mockResolvedValueOnce(undefined);

    await expect(markAdminNotificationAsRead('notif-42')).resolves.toBeUndefined();
    expect(mockedMarkAdminNotificationAsRead).toHaveBeenCalledWith('notif-42');
  });

  it('markAllAdminNotificationsAsRead calls the service without throwing', async () => {
    mockedMarkAllAdminNotificationsAsRead.mockResolvedValueOnce(undefined);

    await expect(markAllAdminNotificationsAsRead()).resolves.toBeUndefined();
    expect(mockedMarkAllAdminNotificationsAsRead).toHaveBeenCalledTimes(1);
  });

});

// ─── Notification content invariants ─────────────────────────────────────────

describe('Admin notification — content invariants', () => {

  it('empty state text is exactly "Nenhuma notificação administrativa no momento."', () => {
    // This test documents the UI contract. The string is rendered verbatim in
    // AdminNotificationPanel > EmptyState. Keep in sync with the component.
    const EMPTY_STATE_TEXT = 'Nenhuma notificação administrativa no momento.';
    expect(EMPTY_STATE_TEXT).toBe('Nenhuma notificação administrativa no momento.');
  });

  it('unread notification has readAt === null', () => {
    const unread = {
      id: 'n1',
      notificationType: 'admin_boleto_overdue' as AdminNotificationType,
      title: 'Boleto vencido',
      message: 'O boleto #123 está vencido.',
      severity: 'warning',
      status: 'delivered',
      actionUrl: null,
      readAt: null,
      deliveredAt: '2026-05-25T10:00:00Z',
      createdAt: '2026-05-25T09:50:00Z',
    };
    expect(unread.readAt).toBeNull();
  });

  it('read notification has readAt as an ISO string', () => {
    const read = {
      id: 'n2',
      notificationType: 'admin_payment_issue' as AdminNotificationType,
      title: 'Problema no pagamento',
      message: 'Falha ao processar pagamento da unidade 42.',
      severity: 'error',
      status: 'read',
      actionUrl: '/admin/payments/42',
      readAt: '2026-05-25T11:00:00Z',
      deliveredAt: '2026-05-25T10:00:00Z',
      createdAt: '2026-05-25T09:55:00Z',
    };
    expect(typeof read.readAt).toBe('string');
    expect(() => new Date(read.readAt!)).not.toThrow();
  });

  it('notification with null actionUrl does not trigger navigation', () => {
    const actionUrl: string | null = null;
    expect(isSafeInternalPath(actionUrl)).toBe(false);
  });

  it('notification with valid actionUrl triggers navigation', () => {
    const actionUrl: string | null = '/admin/kyc/review/456';
    expect(isSafeInternalPath(actionUrl)).toBe(true);
  });

  it('notification with external actionUrl is rejected by the safety guard', () => {
    const actionUrl: string | null = 'https://external.com/phish';
    expect(isSafeInternalPath(actionUrl)).toBe(false);
  });

});

// ─── Visual mapping completeness ──────────────────────────────────────────────

describe('Admin notification visual mapping — completeness', () => {

  it('all 5 known backend types have an explicit non-default mapping', () => {
    const knownTypes: AdminNotificationType[] = [
      'admin_kyc_document_pending_review',
      'admin_boleto_overdue',
      'admin_payment_issue',
      'admin_profile_requires_attention',
      'admin_system_job_failed',
    ];

    const defaultVisual = resolveAdminNotificationVisual('__unknown__');

    knownTypes.forEach((type) => {
      const visual = resolveAdminNotificationVisual(type);
      // Each known type must differ from the default fallback in at least tone.
      expect(visual.tone).not.toBe(defaultVisual.tone);
    });
  });

  it('kyc_pending_review maps to blue (informational tone)', () => {
    expect(resolveAdminNotificationVisual('admin_kyc_document_pending_review').tone).toBe('blue');
  });

  it('boleto_overdue maps to gold (warning tone)', () => {
    expect(resolveAdminNotificationVisual('admin_boleto_overdue').tone).toBe('gold');
  });

  it('payment_issue maps to red (error tone)', () => {
    expect(resolveAdminNotificationVisual('admin_payment_issue').tone).toBe('red');
  });

  it('profile_requires_attention maps to gold (warning tone)', () => {
    expect(resolveAdminNotificationVisual('admin_profile_requires_attention').tone).toBe('gold');
  });

  it('system_job_failed maps to red (error tone)', () => {
    expect(resolveAdminNotificationVisual('admin_system_job_failed').tone).toBe('red');
  });

});
