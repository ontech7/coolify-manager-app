import { SCROLL_FOLLOW_THRESHOLD } from "@/constants";
import { useCallback, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";

/**
 * Keeps a ScrollView pinned to its end as content grows (live logs), but only
 * while the user is at the bottom: scrolling up to read pauses following,
 * scrolling back down resumes it. Pass `enabled: false` to never follow.
 */
export function useScrollFollow(enabled: boolean) {
  const scrollViewRef = useRef<ScrollView>(null);
  const isFollowingRef = useRef(true);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      isFollowingRef.current =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - SCROLL_FOLLOW_THRESHOLD;
    },
    [],
  );

  const onContentSizeChange = useCallback(() => {
    if (enabled && isFollowingRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  }, [enabled]);

  /** Jump to the end and follow again. */
  const scrollToEnd = useCallback(() => {
    isFollowingRef.current = true;
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  return { scrollViewRef, onScroll, onContentSizeChange, scrollToEnd };
}
