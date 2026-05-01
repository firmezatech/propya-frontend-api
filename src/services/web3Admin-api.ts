import axios, { AxiosError } from 'axios';
import { firmezaApiClient } from './firmeza-api-client';


export async function getMonitoring() {
  try {
    const response = await firmezaApiClient.get(`/monitoring`);

    if (response.request.status === 200) {
      // Retorna apenas os dados JSON, não toda a estrutura da resposta
      console.log("response.data======>", response);
      return response;
    }

  } catch (error) {
    console.error("Error fetching from getMonitoring API:", error);
    throw error;
  }
}