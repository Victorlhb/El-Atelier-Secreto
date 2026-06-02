import { StyleSheet, Text, View } from "react-native";
import { AtelierCard } from "./AtelierCard";
import { palette, spacing, typography } from "../../constants/theme";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  inverted = false,
  framed = true,
  compact = false,
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, inverted && styles.eyebrowInverted]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, compact && styles.titleCompact, inverted && styles.titleInverted]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, compact && styles.descriptionCompact, inverted && styles.descriptionInverted]}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.ruleRow}>
        <View style={[styles.ruleDot, inverted && styles.ruleDotInverted]} />
        <View style={[styles.rule, inverted && styles.ruleInverted]} />
      </View>
      {action}
    </View>
  );

  if (!framed) {
    return content;
  }

  return (
    <AtelierCard tone={inverted ? "dark" : "alt"} style={styles.card}>
      {content}
    </AtelierCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 0,
  },
  row: {
    gap: spacing.sm,
  },
  copy: {
    gap: 4,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 2.4,
    color: palette.goldDeep,
    fontSize: 13,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  eyebrowInverted: {
    color: "#C9A24A",
  },
  title: {
    color: palette.text,
    fontSize: 44,
    lineHeight: 48,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  titleInverted: {
    color: "#F5EEE0",
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  description: {
    color: palette.textSoft,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 20,
    lineHeight: 28,
  },
  descriptionCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  descriptionInverted: {
    color: "#E6DDCF",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.gold,
  },
  ruleDotInverted: {
    backgroundColor: "#C9A24A",
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(137,103,36,0.18)",
  },
  ruleInverted: {
    backgroundColor: "rgba(217,208,194,0.22)",
  },
});
