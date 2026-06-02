import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { readerPreview } from "../../constants/mockData";
import { palette, spacing, typography } from "../../constants/theme";
import { useBookDetail } from "../../hooks/useBooks";
import { useAppStore } from "../../store/useAppStore";

export default function ReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: book } = useBookDetail(id);
  const preferences = useAppStore((state) => state.readerPreferences);
  const updateReaderPreferences = useAppStore((state) => state.updateReaderPreferences);

  return (
    <ScreenContainer>
      <AtelierTopBar rightIcon={null} emblem="book-outline" />

      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={palette.goldDeep} />
          <Text style={styles.iconLabel}>Volver</Text>
        </Pressable>
        <View style={styles.preferenceRow}>
          <Pressable
            style={styles.preferenceChip}
            onPress={() =>
              updateReaderPreferences({
                fontScale: preferences.fontScale >= 1.15 ? 1 : preferences.fontScale + 0.05,
              })
            }
          >
            <Text style={styles.preferenceLabel}>Trazo</Text>
          </Pressable>
          <Pressable
            style={styles.preferenceChip}
            onPress={() =>
              updateReaderPreferences({
                lineHeight: preferences.lineHeight >= 2 ? 1.7 : preferences.lineHeight + 0.1,
              })
            }
          >
            <Text style={styles.preferenceLabel}>Respiro</Text>
          </Pressable>
        </View>
      </View>

      <AtelierBanner
        title={book?.title || "El tomo abierto"}
        description="Una pagina clara, tinta serena y controles discretos para no romper el hechizo."
        icon="book-outline"
        compact
      />

      <AtelierCard style={styles.readerSurface} tone="alt">
        {readerPreview.map((paragraph) => (
          <Text
            key={paragraph}
            style={[
              styles.paragraph,
              {
                fontSize: 18 * preferences.fontScale,
                lineHeight: 18 * preferences.fontScale * preferences.lineHeight,
              },
            ]}
          >
            {paragraph}
          </Text>
        ))}
      </AtelierCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconLabel: {
    color: palette.goldDeep,
    fontWeight: "700",
    fontFamily: typography.labelFamily,
  },
  preferenceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  preferenceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F2E8D8",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  preferenceLabel: {
    color: palette.textSoft,
    fontWeight: "600",
    fontFamily: typography.labelFamily,
  },
  readerSurface: {
    backgroundColor: "#FFF8EA",
    gap: spacing.md,
  },
  paragraph: {
    color: "#34342F",
    fontFamily: typography.bodyRegularFamily,
  },
});
