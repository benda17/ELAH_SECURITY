import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_API_URL = "https://elahfounderplatform.vercel.app";
const TOKEN_KEY = "elah_founder_token";
const URL_KEY = "elah_api_url";

export async function getApiUrl() {
  const stored = await AsyncStorage.getItem(URL_KEY);
  return (stored?.replace(/\/$/, "") || DEFAULT_API_URL).trim();
}

export async function setApiUrl(url: string) {
  await AsyncStorage.setItem(URL_KEY, url.replace(/\/$/, "").trim());
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const [base, token] = await Promise.all([getApiUrl(), getToken()]);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });

  if (res.status >= 300 && res.status < 400) {
    throw new ApiError(
      res.status,
      "Login API redirected to the website. The Founder Platform needs the mobile auth deploy.",
    );
  }

  if (res.status === 401) {
    throw new ApiError(401, "Invalid username or password.");
  }
  if (res.status === 405) {
    throw new ApiError(405, "Login API not available on this host yet.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}
