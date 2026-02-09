import { STORAGE_KEYS } from "@/constants";
import type { AppConfig, CoolifyInstance } from "@/types/config";
import * as SecureStore from "expo-secure-store";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function getInstances() {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.INSTANCES);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as CoolifyInstance[];
  } catch {
    return [];
  }
}

async function saveInstances(instances: CoolifyInstance[]) {
  await SecureStore.setItemAsync(
    STORAGE_KEYS.INSTANCES,
    JSON.stringify(instances),
  );
}

async function getActiveInstanceId() {
  return SecureStore.getItemAsync(STORAGE_KEYS.ACTIVE_INSTANCE_ID);
}

async function setActiveInstanceId(id: string | null) {
  if (id) {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVE_INSTANCE_ID, id);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVE_INSTANCE_ID);
  }
}

async function migrateLegacyConfig() {
  const existingInstances = await SecureStore.getItemAsync(
    STORAGE_KEYS.INSTANCES,
  );

  if (existingInstances) return false;

  const legacyUrl = await SecureStore.getItemAsync(
    STORAGE_KEYS.LEGACY_SERVER_URL,
  );
  const legacyToken = await SecureStore.getItemAsync(
    STORAGE_KEYS.LEGACY_API_TOKEN,
  );

  if (!legacyUrl || !legacyToken) return false;

  const instance: CoolifyInstance = {
    id: generateId(),
    name: new URL(legacyUrl).host,
    serverUrl: legacyUrl,
    apiToken: legacyToken,
  };

  await saveInstances([instance]);
  await setActiveInstanceId(instance.id);

  await SecureStore.deleteItemAsync(STORAGE_KEYS.LEGACY_SERVER_URL);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.LEGACY_API_TOKEN);

  return true;
}

export async function getConfig() {
  await migrateLegacyConfig();

  const [instances, activeInstanceId] = await Promise.all([
    getInstances(),
    getActiveInstanceId(),
  ]);

  return { instances, activeInstanceId } as AppConfig;
}

export async function saveConfig(config: AppConfig) {
  await Promise.all([
    saveInstances(config.instances),
    setActiveInstanceId(config.activeInstanceId),
  ]);
}

export async function addInstance(instance: Omit<CoolifyInstance, "id">) {
  const instances = await getInstances();

  const newInstance: CoolifyInstance = { ...instance, id: generateId() };
  instances.push(newInstance);
  await saveInstances(instances);

  const activeId = await getActiveInstanceId();

  if (!activeId) {
    await setActiveInstanceId(newInstance.id);
  }

  return newInstance;
}

export async function updateInstance(instance: CoolifyInstance) {
  const instances = await getInstances();
  const index = instances.findIndex((i) => i.id === instance.id);

  if (index === -1) return;

  instances[index] = instance;
  await saveInstances(instances);
}

export async function removeInstance(id: string) {
  const instances = await getInstances();

  const filtered = instances.filter((i) => i.id !== id);
  await saveInstances(filtered);

  const activeId = await getActiveInstanceId();

  if (activeId === id) {
    await setActiveInstanceId(filtered[0]?.id ?? null);
  }
}

export async function switchActiveInstance(id: string) {
  await setActiveInstanceId(id);
}

export async function clearConfig() {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.INSTANCES),
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVE_INSTANCE_ID),
  ]);
}
