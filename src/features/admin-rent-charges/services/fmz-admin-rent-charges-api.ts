import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzAdminRentCharge,
  FmzAdminRentChargeFilters,
  FmzAdminRentChargeListResponse,
  FmzRentChargeAdjustPayload,
  FmzRentChargeAdjustResponse,
  FmzRentChargeAmounts,
  FmzRentChargeFeeRates,
  FmzRentChargeProperty,
  FmzRentChargeSummary,
  FmzRentChargeTenant,
  FmzRentChargeTokens,
  FmzRentChargeStatus,
} from '../domain';

const ADMIN_RENT_CHARGES_PATH =
  process.env.NEXT_PUBLIC_FMZ_ADMIN_RENT_CHARGES_PATH || '/admin/rent-charges';

// ─── Primitive coercions ──────────────────────────────────────────────────────

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const bool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
  if (typeof value === 'number') return value === 1;
  return fallback;
};

const arr = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// ─── Status normalizer ────────────────────────────────────────────────────────

const rentChargeStatusOf = (value: unknown): FmzRentChargeStatus => {
  const raw = str(value).toLowerCase();
  if (raw === 'open') return 'open';
  if (raw === 'paid') return 'paid';
  return 'pending_validation';
};

// ─── Sub-object normalizers ───────────────────────────────────────────────────

const normalizeAmounts = (value: unknown): FmzRentChargeAmounts => {
  const r = recordOf(value);
  return {
    tokenPurchase: str(r.tokenPurchase ?? r.token_purchase, '0.00'),
    discountedRent: str(r.discountedRent ?? r.discounted_rent, '0.00'),
    platformAdminFee: str(r.platformAdminFee ?? r.platform_admin_fee, '0.00'),
    tokenPurchaseFee: str(r.tokenPurchaseFee ?? r.token_purchase_fee, '0.00'),
    gross: str(r.gross, '0.00'),
  };
};

const normalizeProperty = (value: unknown): FmzRentChargeProperty => {
  const r = recordOf(value);
  return {
    id: str(r.id),
    address: str(r.address),
    neighborhood: str(r.neighborhood),
  };
};

const normalizeTenant = (value: unknown): FmzRentChargeTenant => {
  const r = recordOf(value);
  const name = str(r.name);
  const initials = str(r.initials) || deriveInitials(name);
  return {
    userId: str(r.userId ?? r.user_id),
    name,
    email: str(r.email),
    initials,
  };
};

const deriveInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const normalizeTokens = (value: unknown): FmzRentChargeTokens => {
  const r = recordOf(value);
  return {
    quantity: num(r.quantity, 0),
    unitValueBrl: str(r.unitValueBrl ?? r.unit_value_brl, '0.00'),
    ownershipPercent: str(r.ownershipPercent ?? r.ownership_percent, '0.00'),
  };
};

const normalizeFeeRates = (value: unknown): FmzRentChargeFeeRates => {
  const r = recordOf(value);
  return {
    rentAdminFeePercent: str(r.rentAdminFeePercent ?? r.rent_admin_fee_percent, '0.00'),
    tokenPurchaseFeePercent: str(r.tokenPurchaseFeePercent ?? r.token_purchase_fee_percent, '0.00'),
  };
};

// ─── Full charge normalizer ───────────────────────────────────────────────────

export const normalizeAdminRentCharge = (value: unknown): FmzAdminRentCharge => {
  const r = recordOf(value);
  return {
    id: str(r.id),
    status: rentChargeStatusOf(r.status),
    competenceMonth: str(r.competenceMonth ?? r.competence_month),
    dueDate: str(r.dueDate ?? r.due_date),
    rentalContractId: str(r.rentalContractId ?? r.rental_contract_id),
    contractCode: str(r.contractCode ?? r.contract_code),
    property: normalizeProperty(r.property),
    tenant: normalizeTenant(r.tenant),
    tokens: normalizeTokens(r.tokens),
    amounts: normalizeAmounts(r.amounts),
    calculatedAmounts: normalizeAmounts(r.calculatedAmounts ?? r.calculated_amounts),
    feeRates: normalizeFeeRates(r.feeRates ?? r.fee_rates),
    baseRentAmount: str(r.baseRentAmount ?? r.base_rent_amount, '0.00'),
    discountAmount: str(r.discountAmount ?? r.discount_amount, '0.00'),
    hasManualAdjustment: bool(r.hasManualAdjustment ?? r.has_manual_adjustment, false),
  };
};

// ─── Summary normalizer ───────────────────────────────────────────────────────

const normalizeSummary = (value: unknown): FmzRentChargeSummary => {
  const r = recordOf(value);
  return {
    pendingCount: num(r.pendingCount ?? r.pending_count, 0),
    doneCount: num(r.doneCount ?? r.done_count, 0),
    totalPendingVolumeBrl: str(r.totalPendingVolumeBrl ?? r.total_pending_volume_brl, '0.00'),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function listAdminRentCharges(
  filters: FmzAdminRentChargeFilters,
): Promise<FmzAdminRentChargeListResponse> {
  const params: Record<string, string> = {
    competenceMonth: filters.competenceMonth,
  };
  if (filters.propertyId) params.propertyId = filters.propertyId;
  if (filters.status) params.status = filters.status;

  const { data } = await firmezaApiClient.get(ADMIN_RENT_CHARGES_PATH, { params });
  const r = recordOf(data);

  return {
    summary: normalizeSummary(r.summary),
    charges: arr<unknown>(r.charges).map(normalizeAdminRentCharge),
  };
}

export async function adjustAdminRentCharge(
  rentChargeId: string,
  payload: FmzRentChargeAdjustPayload,
): Promise<FmzRentChargeAdjustResponse> {
  const { data } = await firmezaApiClient.patch(
    `${ADMIN_RENT_CHARGES_PATH}/${encodeURIComponent(rentChargeId)}/adjust`,
    payload,
  );
  const r = recordOf(data);
  return {
    rentChargeId: str(r.rentChargeId ?? r.rent_charge_id, rentChargeId),
    grossAmount: str(r.grossAmount ?? r.gross_amount, '0.00'),
    hasManualAdjustment: bool(r.hasManualAdjustment ?? r.has_manual_adjustment, true),
    adjustmentId: str(r.adjustmentId ?? r.adjustment_id),
  };
}

export async function validateAdminRentCharge(rentChargeId: string): Promise<void> {
  await firmezaApiClient.post(
    `${ADMIN_RENT_CHARGES_PATH}/${encodeURIComponent(rentChargeId)}/validate`,
  );
}
