import { configEvents } from "@/lib/config-events";
import { CoolifyAPI } from "@/lib/coolify-api";
import * as storage from "@/lib/storage";
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
  reinitialize: () => Promise<void>;
}

const CoolifyApiContext = createContext<CoolifyApiContextValue | null>(null);

export function CoolifyApiProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<CoolifyAPI | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const initialize = useCallback(async () => {
    setIsInitializing(true);

    const config = await storage.getConfig();

    if (config) {
      setApi(new CoolifyAPI(config.serverUrl, config.apiToken));
      setIsConfigured(true);
    } else {
      setApi(null);
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
      value={{ api, isConfigured, isInitializing, reinitialize }}
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
