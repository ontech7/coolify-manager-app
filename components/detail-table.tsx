import { colors, radius } from "@/theme";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { DetailRowProps } from "./detail-row";

interface DetailTableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a set of <DetailRow> elements. Filters out rows that won't render
 * (empty value and no children) and marks the last visible one with `isLast`
 * so it doesn't draw a bottom border against the table's rounded edge.
 */
export function DetailTable({ children, style }: DetailTableProps) {
  const visible = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<DetailRowProps> =>
      React.isValidElement<DetailRowProps>(child) &&
      (Boolean(child.props.value) || Boolean(child.props.children)),
  );

  return (
    <View style={[styles.table, style]}>
      {visible.map((child, index) =>
        React.cloneElement(child, { isLast: index === visible.length - 1 }),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
});
