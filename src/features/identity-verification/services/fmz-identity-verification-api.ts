import { firmezaApiClient } from '../../../services/firmeza-api-client';

export type DiditStartResponse = {
  sessionId: string;
  verificationUrl: string;
  status: string;
  isNewSession: boolean;
};

export async function startDiditSession(): Promise<DiditStartResponse> {
  const { data } = await firmezaApiClient.post<Record<string, unknown>>('/kyc/didit/start', {});
  const payload = (data?.data ?? data) as Record<string, unknown>;
  return {
    sessionId: payload.sessionId as string,
    verificationUrl: payload.verificationUrl as string,
    status: payload.status as string,
    isNewSession: Boolean(payload.isNewSession),
  };
}
