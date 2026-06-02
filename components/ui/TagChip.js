import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radii, spacing, typography } from "../../constants/theme";

export function TagChip({ label, active = false, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
        <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: "#FAF1E2",
    borderWidth: 1,
    borderColor: "#D7BF92",
  },
  active: {
    backgroundColor: palette.sageDeep,
    borderColor: palette.goldDeep,
  },
  text: {
    color: palette.textSoft,
    fontSize: 15,
    fontFamily: typography.labelFamily,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  activeText: {
    color: "#F6EEDC",
  },
});
