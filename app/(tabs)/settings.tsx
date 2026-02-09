import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Text } from "@/components/ui/text";
import { GITHUB_REPO_URL } from "@/constants";
import { useConfig } from "@/hooks/useConfig";
import { colors, radius, spacing } from "@/theme";
import { validateApiToken, validateServerUrl } from "@/utils/validation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import packageJson from "../../package.json";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    config,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    saveConfig,
    testConnection,
    clearTestResult,
  } = useConfig();

  const [serverUrl, setServerUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [serverUrlError, setServerUrlError] = useState<string | null>(null);
  const [apiTokenError, setApiTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setServerUrl(config.serverUrl);
      setApiToken(config.apiToken);
    }
  }, [config]);

  useEffect(() => {
    clearTestResult();
  }, [serverUrl, apiToken, clearTestResult]);

  const validateForm = useCallback((): boolean => {
    const urlError = validateServerUrl(serverUrl);
    const tokenError = validateApiToken(apiToken);

    setServerUrlError(urlError);
    setApiTokenError(tokenError);

    return !urlError && !tokenError;
  }, [serverUrl, apiToken]);

  const handleTestConnection = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    await testConnection(serverUrl, apiToken);
  }, [validateForm, testConnection, serverUrl, apiToken]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    await saveConfig({
      serverUrl: serverUrl.trim(),
      apiToken: apiToken.trim(),
    });

    Alert.alert("Success", "Configuration saved successfully!");
  }, [validateForm, saveConfig, serverUrl, apiToken]);

  const handleServerUrlChange = useCallback((text: string) => {
    setServerUrl(text);
    setServerUrlError(null);
  }, []);

  const handleApiTokenChange = useCallback((text: string) => {
    setApiToken(text);
    setApiTokenError(null);
  }, []);

  const handleOpenLink = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Cannot open this URL: ${url}`);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner message="Loading settings..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Configure your Coolify server connection
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>

          <Input
            label="Server URL"
            placeholder="https://coolify.example.com"
            value={serverUrl}
            onChangeText={handleServerUrlChange}
            error={serverUrlError ?? undefined}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Input
            label="API Token"
            placeholder="Enter your API token"
            value={apiToken}
            onChangeText={handleApiTokenChange}
            error={apiTokenError ?? undefined}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputSpacing}
          />

          <View style={styles.helpBox}>
            <Text style={styles.helpBoxTitle}>How to generate the token:</Text>
            <View style={styles.helpBoxList}>
              <Text style={styles.helpBoxListItem}>
                1. Go to{" "}
                <Text style={styles.helpBoxHighlight}>
                  Settings → Advanced → API Access
                </Text>{" "}
                and enable the API
              </Text>
              <Text style={styles.helpBoxListItem}>
                2. Go to{" "}
                <Text style={styles.helpBoxHighlight}>
                  Keys & Tokens → API Tokens
                </Text>
              </Text>
              <Text style={styles.helpBoxListItem}>
                Create a new token with permissions:
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>read</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>write</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>deploy</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title={isTesting ? "Testing..." : "Test Connection"}
            variant="secondary"
            adornmentStart={
              <MaterialIcons
                name="check-circle-outline"
                size={20}
                color={colors.text.primary}
              />
            }
            onPress={handleTestConnection}
            loading={isTesting}
            disabled={!serverUrl || !apiToken}
          />
          <Button
            title={isSaving ? "Saving..." : "Save Configuration"}
            adornmentStart={
              <MaterialIcons
                name="save"
                size={20}
                color={colors.text.primary}
              />
            }
            onPress={handleSave}
            loading={isSaving}
            disabled={!serverUrl || !apiToken}
          />
        </View>

        <View style={styles.testSection}>
          {testResult && (
            <View
              style={[
                styles.testResult,
                testResult.success
                  ? styles.testResultSuccess
                  : styles.testResultError,
              ]}
            >
              <Text
                style={[
                  styles.testResultText,
                  testResult.success
                    ? styles.testResultTextSuccess
                    : styles.testResultTextError,
                ]}
              >
                {testResult.success
                  ? "✓ Connection successful!"
                  : `✗ ${testResult.error || "Connection failed"}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.authorSection}>
          <Text style={styles.authorText}>v{packageJson.version}</Text>
          <Text style={styles.authorText}>·</Text>
          <Text
            style={[styles.authorText, styles.authorLink]}
            onPress={() => handleOpenLink(GITHUB_REPO_URL)}
          >
            Made by ontech7
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing["3xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  section: {
    marginBottom: spacing["3xl"],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputSpacing: {
    marginTop: spacing.lg,
  },
  helpBox: {
    backgroundColor: colors.surface.hover,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  helpBoxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  helpBoxList: {
    gap: spacing.sm,
  },
  helpBoxListItem: {
    fontSize: 12,
    color: colors.text.muted,
  },
  helpBoxHighlight: {
    color: colors.primary.light,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.surface.border,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: colors.status.warning,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  testSection: {
    marginTop: spacing["4xl"],
    gap: spacing.lg,
  },
  testResult: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  testResultSuccess: {
    backgroundColor: colors.status.successBg,
  },
  testResultError: {
    backgroundColor: colors.status.errorBg,
  },
  testResultText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  testResultTextSuccess: {
    color: colors.status.success,
  },
  testResultTextError: {
    color: colors.status.error,
  },
  authorSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing["xl"],
  },
  authorText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  authorLink: {
    textDecorationLine: "underline",
    color: colors.text.primary,
  },
});
