import { STORAGE_KEYS } from "@/constants";
import type { AppConfig } from "@/types/config";
import * as SecureStore from "expo-secure-store";

export async function getServerUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL);
}

export async function setServerUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.SERVER_URL, url);
}

export async function getApiToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.API_TOKEN);
}

export async function setApiToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.API_TOKEN, token);
}

export async function getConfig(): Promise<AppConfig | null> {
  const [serverUrl, apiToken] = await Promise.all([
    getServerUrl(),
    getApiToken(),
  ]);

  if (!serverUrl || !apiToken) {
    return null;
  }

  return {
    serverUrl,
    apiToken,
  };
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await Promise.all([
    setServerUrl(config.serverUrl),
    setApiToken(config.apiToken),
  ]);
}

export async function clearConfig(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.SERVER_URL),
    SecureStore.deleteItemAsync(STORAGE_KEYS.API_TOKEN),
  ]);
}
