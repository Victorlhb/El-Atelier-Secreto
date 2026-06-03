import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, spacing } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";

export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  safeEdges = ["top"],
  edges,
  tone = "atelier",
}) {
  const { contentWidth, isTablet } = useResponsive();
  const resolvedEdges = edges || safeEdges;
  const contentGap = isTablet ? spacing.lg : spacing.md;
  const horizontalPadding = isTablet ? spacing.lg : spacing.md;
  const topPadding = isTablet ? spacing.lg : spacing.sm + 2;
  const bottomPadding = isTablet ? spacing.xxl + spacing.sm : spacing.xxl;

  const inner = (
    <View
      style={[
        styles.content,
        !scroll && styles.contentFill,
        {
          maxWidth: contentWidth,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
          gap: contentGap,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, tone === "paper" && styles.paperRoot, tone === "night" && styles.nightRoot]}>
      {tone === "atelier" ? <View style={styles.inkBand} /> : null}
      <View
        style={[
          styles.glowLeft,
          tone === "paper" && styles.paperGlowLeft,
          tone === "night" && styles.nightGlowLeft,
        ]}
      />
      <View
        style={[
          styles.glowRight,
          tone === "paper" && styles.paperGlowRight,
          tone === "night" && styles.nightGlowRight,
        ]}
      />
      {tone === "paper" ? <View style={styles.paperVeil} /> : null}
      {tone === "night" ? <View style={styles.nightVeil} /> : null}
      <SafeAreaView style={styles.safeArea} edges={resolvedEdges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  paperRoot: {
    backgroundColor: "#cec1ab",
  },
  nightRoot: {
    backgroundColor: "#0B1713",
  },
  inkBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 270,
    backgroundColor: palette.ink,
  },
  glowLeft: {
    position: "absolute",
    top: 86,
    left: -54,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(209,203,221,0.22)",
  },
  paperGlowLeft: {
    top: 36,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(201,162,74,0.08)",
  },
  nightGlowLeft: {
    top: 34,
    left: -46,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(200,156,78,0.06)",
  },
  glowRight: {
    position: "absolute",
    top: 128,
    right: -48,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(121,149,141,0.22)",
  },
  paperGlowRight: {
    top: 120,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(76,125,137,0.08)",
  },
  nightGlowRight: {
    top: 120,
    right: -64,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(76,125,137,0.08)",
  },
  paperVeil: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,253,249,0.22)",
  },
  nightVeil: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(6,12,10,0.26)",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  content: {
    width: "100%",
    alignSelf: "center",
  },
  contentFill: {
    flex: 1,
  },
});
