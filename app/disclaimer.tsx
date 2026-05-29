import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COOLIFY_URL = "https://coolify.io";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

function Section({
  icon,
  title,
  children,
}: {
  icon: MaterialIconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={20} color={colors.primary.light} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionText}>{children}</Text>
    </Card>
  );
}

export default function DisclaimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleOpenCoolify = useCallback(() => {
    Linking.openURL(COOLIFY_URL);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle}>Disclaimer</Text>
        <IconButton name="close" size={24} onPress={handleClose} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
      >
        <Section icon="api" title="Official Coolify API">
          This app communicates with your servers exclusively through the
          official Coolify API. Your credentials stay on your device and are
          sent only to the instances you configure.
        </Section>

        <Section icon="info-outline" title="Not a replacement for Coolify">
          Coolify Manager is not a replacement for Coolify. It&apos;s a
          lightweight companion built to perform a handful of common operations
          quickly from your phone. For full management and configuration, use
          the official Coolify dashboard.
        </Section>

        <Section icon="groups" title="A community project">
          This app is a community initiative created by ontech7. It is not
          affiliated with, endorsed by, or maintained by the official Coolify
          team.
        </Section>

        <Text style={styles.link} onPress={handleOpenCoolify}>
          Learn more at coolify.io
        </Text>

        <Text style={styles.footer}>Made with ❤️ for the Coolify community</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginRight: spacing.lg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.muted,
  },
  link: {
    fontSize: 13,
    color: colors.status.info,
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: spacing.md,
  },
  footer: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing["3xl"],
  },
});
