import { StyleSheet, Text, View } from "react-native";
import { AtelierCard } from "./AtelierCard";
import { palette, spacing, typography } from "../../constants/theme";

export function EmptyState({ title, description }) {
  return (
    <AtelierCard tone="alt">
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </AtelierCard>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    gap: 6,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  description: {
    color: "#4A3A2A",
    fontFamily: typography.bodySemiBoldFamily,
    fontSize: 17,
    lineHeight: 24,
  },
});
