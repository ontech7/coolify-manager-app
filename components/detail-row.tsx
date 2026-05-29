import { Text } from "@/components/ui/text";
import { triggerHaptic } from "@/hooks/useHaptics";
import { colors, radius, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export interface DetailRowProps {
  label: string;
  value?: string | null;
  mono?: boolean;
  children?: React.ReactNode;
  /** Set by DetailTable on the last visible row to drop the bottom border. */
  isLast?: boolean;
  /** Show a copy-to-clipboard button for the value. */
  copyable?: boolean;
}

export function DetailRow({
  label,
  value,
  mono,
  children,
  isLast,
  copyable,
}: DetailRowProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    triggerHaptic("success");
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  if (!value && !children) return null;

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>
      {children ? (
        children
      ) : (
        <View style={styles.valueWrap}>
          <Text
            style={[
              styles.value,
              // Normal values always fill; mono pills only fill when copyable
              // (so they leave room for the copy button and truncate instead of
              // overflowing). A non-copyable mono pill stays content-sized.
              (!mono || copyable) && styles.valueFill,
              mono && styles.monoValue,
            ]}
            numberOfLines={copyable ? 1 : 2}
          >
            {value}
          </Text>
          {copyable && value ? (
            <Pressable onPress={handleCopy} hitSlop={8} style={styles.copyButton}>
              <MaterialIcons
                name={copied ? "check" : "content-copy"}
                size={16}
                color={copied ? colors.status.success : colors.text.muted}
              />
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    width: 100,
    fontSize: 13,
    color: colors.text.disabled,
  },
  valueWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  value: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  valueFill: {
    flex: 1,
    minWidth: 0,
  },
  monoValue: {
    fontFamily: "monospace",
    fontSize: 11,
    backgroundColor: colors.surface.hover,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    color: colors.primary.light,
  },
  copyButton: {
    flexShrink: 0,
    padding: spacing.xs,
  },
});
