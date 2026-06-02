import { StyleSheet, View } from "react-native";
import { palette, radii, shadows, spacing } from "../../constants/theme";

export function AtelierCard({ children, style, padded = true, tone = "default" }) {
  return (
    <View
      style={[
        styles.card,
        tone === "alt" && styles.altCard,
        tone === "dark" && styles.darkCard,
        padded && styles.padded,
        style,
      ]}
    >
      <View style={[styles.outerStroke, tone === "dark" && styles.outerStrokeDark]} />
      <View style={styles.innerStroke} />
      <View style={[styles.corner, styles.cornerTopLeft, tone === "dark" && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerTopRight, tone === "dark" && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerBottomLeft, tone === "dark" && styles.cornerDark]} />
      <View style={[styles.corner, styles.cornerBottomRight, tone === "dark" && styles.cornerDark]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    overflow: "hidden",
    ...shadows,
  },
  altCard: {
    backgroundColor: palette.cardAlt,
  },
  darkCard: {
    backgroundColor: palette.ink,
    borderColor: "#6E5B33",
  },
  outerStroke: {
    position: "absolute",
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: radii.lg - 2,
    borderWidth: 1,
    borderColor: "rgba(167,131,66,0.22)",
  },
  outerStrokeDark: {
    borderColor: "rgba(201,162,74,0.22)",
  },
  innerStroke: {
    position: "absolute",
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    borderRadius: radii.md + 2,
    borderWidth: 1,
    borderColor: "rgba(167,131,66,0.28)",
  },
  padded: {
    padding: spacing.md,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: "rgba(167,131,66,0.62)",
  },
  cornerDark: {
    borderColor: "rgba(201,162,74,0.8)",
  },
  cornerTopLeft: {
    top: 7,
    left: 7,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  cornerTopRight: {
    top: 7,
    right: 7,
    borderRightWidth: 1,
    borderTopWidth: 1,
  },
  cornerBottomLeft: {
    bottom: 7,
    left: 7,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  cornerBottomRight: {
    bottom: 7,
    right: 7,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
});
