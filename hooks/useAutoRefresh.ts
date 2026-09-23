import { AUTO_REFRESH_INTERVAL } from "@/constants";
import { useIsFocused } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

/**
 * Calls `refresh` every `interval` ms while `enabled`, but only while the
 * screen is focused and the app is in the foreground: hidden tabs and a
 * backgrounded app don't keep polling the server (battery, data, rate limits).
 * When the screen becomes visible again after a pause, it refreshes right
 * away instead of showing stale data until the next tick.
 *
 * The next tick is scheduled only after the previous request finishes, so a
 * slow server doesn't pile up requests. `refresh` should handle its own
 * errors; a rejection is swallowed so polling keeps going.
 */
export function useAutoRefresh(
  refresh: () => Promise<unknown>,
  enabled: boolean,
  interval: number = AUTO_REFRESH_INTERVAL,
) {
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState !== "background",
  );
  const wasPausedRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsAppActive(state !== "background");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isFocused || !isAppActive) {
      wasPausedRef.current = true;
    }
  }, [isFocused, isAppActive]);

  const shouldRun = enabled && isFocused && isAppActive;

  useEffect(() => {
    if (!shouldRun) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        await refresh();
      } catch {
        // The caller surfaces errors; keep polling.
      } finally {
        if (!cancelled) {
          timer = setTimeout(tick, interval);
        }
      }
    };

    if (wasPausedRef.current) {
      wasPausedRef.current = false;
      tick();
    } else {
      timer = setTimeout(tick, interval);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [shouldRun, refresh, interval]);
}
