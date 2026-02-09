import { configEvents } from "@/lib/config-events";
import { CoolifyAPI } from "@/lib/coolify-api";
import * as storage from "@/lib/storage";
import type { TestConnectionResponse } from "@/types/api";
import type { AppConfig, CoolifyInstance } from "@/types/config";
import { useCallback, useEffect, useState } from "react";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>({
    instances: [],
    activeInstanceId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(
    null,
  );

  const activeInstance =
    config.instances.find((i) => i.id === config.activeInstanceId) ?? null;

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedConfig = await storage.getConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addInstance = useCallback(
    async (instance: Omit<CoolifyInstance, "id">) => {
      try {
        setIsSaving(true);

        const newInstance = await storage.addInstance(instance);
        const updatedConfig = await storage.getConfig();

        setConfig(updatedConfig);

        configEvents.emit();

        return newInstance;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const updateInstance = useCallback(async (instance: CoolifyInstance) => {
    try {
      setIsSaving(true);

      await storage.updateInstance(instance);

      const updatedConfig = await storage.getConfig();

      setConfig(updatedConfig);

      configEvents.emit();
    } finally {
      setIsSaving(false);
    }
  }, []);

  const removeInstance = useCallback(async (id: string) => {
    try {
      setIsSaving(true);

      await storage.removeInstance(id);

      const updatedConfig = await storage.getConfig();

      setConfig(updatedConfig);

      configEvents.emit();
    } finally {
      setIsSaving(false);
    }
  }, []);

  const switchInstance = useCallback(async (id: string) => {
    await storage.switchActiveInstance(id);

    const updatedConfig = await storage.getConfig();
    setConfig(updatedConfig);

    configEvents.emit();
  }, []);

  const testConnection = useCallback(
    async (serverUrl: string, apiToken: string) => {
      try {
        setIsTesting(true);
        setTestResult(null);

        const api = new CoolifyAPI(serverUrl, apiToken);
        const result = await api.testConnection();

        setTestResult(result);

        return result;
      } catch (error) {
        const result: TestConnectionResponse = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        setTestResult(result);

        return result;
      } finally {
        setIsTesting(false);
      }
    },
    [],
  );

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    instances: config.instances,
    activeInstance,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    loadConfig,
    addInstance,
    updateInstance,
    removeInstance,
    switchInstance,
    testConnection,
    clearTestResult,
  };
}
