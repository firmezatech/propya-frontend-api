import axios, { AxiosError, AxiosInstance } from "axios";
import { clearFirmezaSession, getFirmezaAccessToken } from "./auth/auth-storage";

const DEFAULT_FMZ_API_TIMEOUT_MS = 30000;

function getFirmezaApiBaseUrl(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_FIRMEZA_API_URL || process.env.NEXT_API_URL_FIRMEZA;
  return configuredUrl?.replace(/\/$/, "");
}

function getFirmezaApiBaseUrlOrThrow(): string {
  const baseUrl = getFirmezaApiBaseUrl();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_FIRMEZA_API_URL environment variable is required.");
  }

  return baseUrl;
}

function getFirmezaApiTimeoutMs(): number {
  const timeout = Number(process.env.NEXT_PUBLIC_FMZ_API_TIMEOUT_MS || DEFAULT_FMZ_API_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_FMZ_API_TIMEOUT_MS;
}

function createFirmezaApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getFirmezaApiBaseUrl(),
    timeout: getFirmezaApiTimeoutMs(),
  });

  client.interceptors.request.use((config) => {
    const baseUrl = getFirmezaApiBaseUrlOrThrow();
    config.baseURL = baseUrl;

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
  const baseUrl = getFirmezaApiBaseUrlOrThrow();
  const accessToken = getFirmezaAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearFirmezaSession();
  }

  return response;
}
