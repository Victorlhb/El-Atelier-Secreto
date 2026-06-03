import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";

export function AtelierButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  labelStyle,
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      <View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          style={[
            styles.label,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
            labelStyle,
          ]}
        >
          {loading ? "Cargando..." : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  primary: {
    backgroundColor: palette.gold,
    borderWidth: 1,
    borderColor: palette.goldDeep,
  },
  secondary: {
    backgroundColor: "rgba(252,244,231,0.86)",
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  disabled: {
    opacity: 0.65,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: typography.displayAltFamily,
    letterSpacing: 0.4,
  },
  primaryLabel: {
    color: "#2D2112",
  },
  secondaryLabel: {
    color: palette.goldDeep,
  },
});
