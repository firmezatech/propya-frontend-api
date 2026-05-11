import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { fmzTokenomicsCalculatorConfig } from '../config/fmz-tokenomics-calculator.config';
import type { FmzTokenomicsDistributionPayload, FmzTokenomicsDistributionResult } from '../domain/fmz-tokenomics-calculator.types';

export async function calculateTokenomicsDistribution(
  payload: FmzTokenomicsDistributionPayload,
): Promise<FmzTokenomicsDistributionResult> {
  const { data } = await firmezaApiClient.post<FmzTokenomicsDistributionResult>(
    fmzTokenomicsCalculatorConfig.calculatePath,
    payload,
  );

  return data;
}
