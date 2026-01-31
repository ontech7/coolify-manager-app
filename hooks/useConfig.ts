import { configEvents } from "@/lib/config-events";
import { CoolifyAPI } from "@/lib/coolify-api";
import * as storage from "@/lib/storage";
import type { TestConnectionResponse } from "@/types/api";
import type { AppConfig } from "@/types/config";
import { useCallback, useEffect, useState } from "react";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(
    null,
  );

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedConfig = await storage.getConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: AppConfig) => {
    setIsSaving(true);
    try {
      await storage.saveConfig(newConfig);
      setConfig(newConfig);
      configEvents.emit();
    } finally {
      setIsSaving(false);
    }
  }, []);

  const testConnection = useCallback(
    async (
      serverUrl: string,
      apiToken: string,
    ): Promise<TestConnectionResponse> => {
      setIsTesting(true);
      setTestResult(null);
      try {
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
    isLoading,
    isSaving,
    isTesting,
    testResult,
    loadConfig,
    saveConfig,
    testConnection,
    clearTestResult,
  };
}
