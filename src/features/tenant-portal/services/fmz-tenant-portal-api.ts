import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { getCurrentAccessControlPrincipal } from '../../access-control/services';
import type { FmzTenantDashboard, FmzTenantDashboardPayload, FmzTenantPaymentHistoryItem, FmzTenantWallet } from '../domain/fmz-tenant-portal.types';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const arrayOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};
const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeWallet = (wallet: unknown): FmzTenantWallet => {
  const row = recordOf(wallet);
  return {
    id: str(row.id),
    userId: str(row.userId ?? row.user_id),
    walletAddress: str(row.walletAddress ?? row.wallet_address ?? row.publicKey ?? row.public_key),
    publicKey: str(row.publicKey ?? row.public_key ?? row.walletAddress ?? row.wallet_address),
    chainId: str(row.chainId ?? row.chain_id),
    walletType: str(row.walletType ?? row.wallet_type),
    custodyType: str(row.custodyType ?? row.custody_type),
    verificationStatus: str(row.verificationStatus ?? row.verification_status),
    status: str(row.status),
    assignedAt: str(row.assignedAt ?? row.assigned_at),
    verifiedAt: str(row.verifiedAt ?? row.verified_at),
    createdAt: str(row.createdAt ?? row.created_at),
    updatedAt: str(row.updatedAt ?? row.updated_at),
  };
};

const buildTenantPaymentHistoryFromDashboard = (dashboard: FmzTenantDashboard | null): FmzTenantPaymentHistoryItem[] => {
  const boleto = dashboard?.boleto;
  const summary = dashboard?.monthlySummary;

  if (!boleto && !summary) return [];

  const amount = num(summary?.totalDueAmount);
  const id = str(boleto?.paymentTransactionId) ?? str(summary?.rentChargeId) ?? 'current-rent-charge';

  return [{
    id,
    reference: dashboard?.competence?.label ?? dashboard?.competence?.month ?? 'Competência atual',
    dueDate: summary?.dueDate ?? null,
    paidAt: boleto?.paidAt ?? null,
    status: boleto?.status ?? summary?.status ?? null,
    amount,
    paymentProvider: boleto?.paymentProvider ?? null,
    paymentMethod: boleto?.paymentMethod ?? 'boleto',
    downloadUrl: boleto?.downloadUrl ?? null,
    digitableLine: boleto?.digitableLine ?? null,
  }];
};

export async function getTenantDashboard(propertyId?: string | number | null): Promise<FmzTenantDashboardPayload> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(String(propertyId))}` : '';
  const { data } = await firmezaApiClient.get(`/tenant/dashboard${query}`);
  return data as FmzTenantDashboardPayload;
}

export async function getCurrentTenantDashboard(propertyId?: string | number | null): Promise<FmzTenantDashboard | null> {
  const payload = await getTenantDashboard(propertyId);
  return payload.hasData === false ? null : payload.dashboard ?? null;
}

export async function getCurrentTenantPaymentHistory(propertyId?: string | number | null): Promise<FmzTenantPaymentHistoryItem[]> {
  const dashboard = await getCurrentTenantDashboard(propertyId);
  return buildTenantPaymentHistoryFromDashboard(dashboard);
}

export async function getCurrentTenantWallets(): Promise<FmzTenantWallet[]> {
  const [principal, response] = await Promise.all([
    getCurrentAccessControlPrincipal().catch(() => null),
    firmezaApiClient.get('/listWallets'),
  ]);

  const root = recordOf(response.data);
  const wallets = arrayOf(root.wallets ?? root.data ?? response.data).map(normalizeWallet);
  const principalId = String(principal?.id ?? '').trim();

  if (!principalId) return wallets;

  const ownWallets = wallets.filter((wallet) => String(wallet.userId ?? '').trim() === principalId);
  return ownWallets.length > 0 ? ownWallets : wallets;
}
