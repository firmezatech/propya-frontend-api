import {
  AlertTriangle,
  Bell,
  Calendar,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Coins,
  User,
  XCircle,
} from 'lucide-react';
import type { NotificationVisual } from '../../notifications/domain/fmz-notifications.types';

const NOTIFICATION_VISUAL_MAP: Record<string, NotificationVisual> = {
  boleto_available:         { icon: CreditCard,    tone: 'gold'  },
  boleto_due_in_10_days:    { icon: Calendar,      tone: 'blue'  },
  boleto_due_in_5_days:     { icon: Calendar,      tone: 'gold'  },
  boleto_due_in_2_days:     { icon: AlertTriangle, tone: 'gold'  },
  boleto_overdue:           { icon: XCircle,       tone: 'red'   },
  rent_charge_paid:         { icon: CreditCard,    tone: 'green' },
  token_purchase_settled:   { icon: Coins,         tone: 'green' },
  order_refund_opened:      { icon: RotateCcw,     tone: 'blue'  },
  order_refund_completed:   { icon: RotateCcw,     tone: 'green' },
  kyc_document_under_review:       { icon: ShieldCheck, tone: 'blue'  },
  kyc_document_verified:           { icon: ShieldCheck, tone: 'green' },
  kyc_document_rejected:           { icon: ShieldCheck, tone: 'red'   },
  kyc_document_needs_resubmission: { icon: ShieldCheck, tone: 'gold'  },
  kyc_profile_verified:            { icon: ShieldCheck, tone: 'green' },
  didit_kyc_soft_declined:         { icon: ShieldCheck, tone: 'gold'  },
  didit_kyc_banned:                { icon: ShieldCheck, tone: 'red'   },
  didit_kyc_in_review:             { icon: ShieldCheck, tone: 'blue'  },
  profile_incomplete:       { icon: User, tone: 'navy' },
};

const FALLBACK_VISUAL: NotificationVisual = { icon: Bell, tone: 'navy' };

/** Unknown types fall back to Bell/navy — safe default for future notification_types added on the backend. */
export function resolveTenantNotificationVisual(type: string): NotificationVisual {
  return NOTIFICATION_VISUAL_MAP[type] ?? FALLBACK_VISUAL;
}
