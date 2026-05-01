import axios, { AxiosError, AxiosInstance } from "axios";
import { clearFirmezaSession, getFirmezaAccessToken } from "./auth/auth-storage";

const FIRMEZA_API_BASE_URL = process.env.NEXT_PUBLIC_FIRMEZA_API_URL || process.env.NEXT_API_URL_FIRMEZA;

if (!FIRMEZA_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_FIRMEZA_API_URL environment variable is required.");
}

function createFirmezaApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: FIRMEZA_API_BASE_URL,
    timeout: Number(process.env.NEXT_PUBLIC_FMZ_API_TIMEOUT_MS || 30000),
  });

  client.interceptors.request.use((config) => {
    const accessToken = getFirmezaAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        clearFirmezaSession();
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const firmezaApiClient = createFirmezaApiClient();
export const isFirmezaApiError = axios.isAxiosError;

export async function authenticatedFirmezaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = getFirmezaAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${FIRMEZA_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearFirmezaSession();
  }

  return response;
}
