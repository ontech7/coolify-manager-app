import { configEvents } from "@/lib/config-events";
import { CoolifyAPI } from "@/lib/coolify-api";
import * as storage from "@/lib/storage";
import type { CoolifyInstance } from "@/types/config";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface CoolifyApiContextValue {
  api: CoolifyAPI | null;
  isConfigured: boolean;
  isInitializing: boolean;
  activeInstance: CoolifyInstance | null;
  reinitialize: () => Promise<void>;
}

const CoolifyApiContext = createContext<CoolifyApiContextValue | null>(null);

export function CoolifyApiProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<CoolifyAPI | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeInstance, setActiveInstance] = useState<CoolifyInstance | null>(
    null,
  );

  const initialize = useCallback(async () => {
    setIsInitializing(true);

    const config = await storage.getConfig();
    const active = config.instances.find(
      (i) => i.id === config.activeInstanceId,
    );

    if (active) {
      setApi(new CoolifyAPI(active.serverUrl, active.apiToken));
      setActiveInstance(active);
      setIsConfigured(true);
    } else {
      setApi(null);
      setActiveInstance(null);
      setIsConfigured(false);
    }

    setIsInitializing(false);
  }, []);

  const reinitialize = useCallback(async () => {
    await initialize();
  }, [initialize]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // @ts-ignore
  useEffect(() => {
    const unsubscribe = configEvents.subscribe(() => {
      initialize();
    });

    return unsubscribe;
  }, [initialize]);

  return (
    <CoolifyApiContext.Provider
      value={{ api, isConfigured, isInitializing, activeInstance, reinitialize }}
    >
      {children}
    </CoolifyApiContext.Provider>
  );
}

export function useCoolifyApi(): CoolifyApiContextValue {
  const context = useContext(CoolifyApiContext);

  if (!context) {
    throw new Error("useCoolifyApi must be used within an CoolifyApiProvider");
  }

  return context;
}
