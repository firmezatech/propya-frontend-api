import { firmezaApiClient } from './firmeza-api-client';

export async function getMonitoring() {
  const response = await firmezaApiClient.get('/monitoring');
  return response;
}
