import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { AtelierCard } from "./AtelierCard";

export function AtelierBanner({ title, description, icon = "sparkles-outline", compact = false }) {
  const { isTablet } = useResponsive();
  return (
    <AtelierCard style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.row}>
        <View style={[styles.emblem, compact && styles.compactEmblem]}>
          <Ionicons name={icon} size={compact ? 26 : 34} color={palette.goldDeep} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, compact && styles.compactTitle, compact && !isTablet && styles.compactTitleMobile]}>
            {title}
          </Text>
          <Text
            style={[
              styles.description,
              compact && styles.compactDescription,
              compact && !isTablet && styles.compactDescriptionMobile,
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
      <Ionicons name="star-outline" size={18} color={palette.goldDeep} style={styles.star} />
    </AtelierCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FBF1DF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  compactCard: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md - 2,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  emblem: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: "rgba(167,131,66,0.26)",
    backgroundColor: "rgba(248,236,214,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  compactEmblem: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: palette.text,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  compactTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  compactTitleMobile: {
    fontSize: 18,
    lineHeight: 22,
  },
  description: {
    color: palette.textSoft,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: typography.bodyRegularFamily,
  },
  compactDescription: {
    color: "#3F3224",
    fontSize: 16,
    lineHeight: 21,
    fontFamily: typography.bodySemiBoldFamily,
  },
  compactDescriptionMobile: {
    fontSize: 13,
    lineHeight: 17,
  },
  star: {
    position: "absolute",
    top: 18,
    right: 18,
  },
});
