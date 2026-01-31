import { colors, radius, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Text } from "./text";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = useCallback(() => {
    setIsSecure((prev) => !prev);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.disabled}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={toggleSecure} style={styles.toggleButton}>
            <MaterialIcons
              name={isSecure ? "visibility" : "visibility-off"}
              size={18}
              color={colors.text.muted}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 13,
    color: colors.text.primary,
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontSize: 11,
    color: colors.status.error,
  },
});
