import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, typography } from "../../constants/theme";

export function AtelierTopBar({ rightIcon = "person-circle-outline", onRightPress, emblem = "sparkles-outline" }) {
  return (
    <View style={styles.row}>
      <Ionicons name={emblem} size={20} color={palette.gold} />
      <View style={styles.brandWrap}>
        <View style={styles.line} />
        <Text style={styles.brand}>El Atelier Secreto</Text>
        <View style={styles.line} />
      </View>
      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.iconButton}>
          <Ionicons name={rightIcon} size={22} color={palette.gold} />
        </Pressable>
      ) : (
        <View style={styles.iconSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(200,156,78,0.36)",
  },
  brand: {
    color: "#E0B96F",
    fontSize: 22,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  iconButton: {
    width: 34,
    alignItems: "flex-end",
  },
  iconSpacer: {
    width: 34,
  },
});
