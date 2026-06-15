import type { FmzAdminTokenOrder, FmzDeliveryEvent, FmzTokenOrderTimelineEvent } from './fmz-admin-token-orders.types';
import { ORDER_DELIVERY_EVENT_LABELS } from './fmz-admin-token-orders.types';

// Sintetiza eventos do ciclo de vida da ordem (D-4).
// Mescla com eventos reais de order_delivery_events e ordena por timestamp.
export function buildTimeline(
  order: FmzAdminTokenOrder,
  deliveryEvents: FmzDeliveryEvent[],
): FmzTokenOrderTimelineEvent[] {
  const events: FmzTokenOrderTimelineEvent[] = [];

  // Sintético: compra iniciada
  events.push({
    id:          `synthetic-created-${order.id}`,
    type:        'info',
    title:       'Compra iniciada',
    timestamp:   order.createdAt,
    isSynthetic: true,
  });

  // Sintético: pagamento confirmado
  if (order.payment?.paidAt) {
    events.push({
      id:          `synthetic-paid-${order.id}`,
      type:        'info',
      title:       'Pagamento confirmado',
      timestamp:   order.payment.paidAt,
      isSynthetic: true,
    });
  }

  // Sintético: tokens entregues
  if (order.completedAt) {
    events.push({
      id:          `synthetic-completed-${order.id}`,
      type:        'ok',
      title:       'Tokens entregues',
      timestamp:   order.completedAt,
      isSynthetic: true,
    });
  }

  // Eventos reais do banco
  for (const ev of deliveryEvents) {
    const meta = ORDER_DELIVERY_EVENT_LABELS[ev.event_type];
    const type = meta?.type ?? 'info';
    let title  = meta?.title ?? ev.event_type;

    if (ev.event_type === 'delivery_attempt_failed' && ev.attempt_no != null) {
      title = `${title} (tentativa #${ev.attempt_no})`;
    }

    events.push({
      id:          ev.id,
      type,
      title,
      description: ev.reason ?? undefined,
      timestamp:   ev.occurred_at,
      isSynthetic: false,
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
