import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Buscar por titulo, autora o saga",
  compact = false,
}) {
  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <Ionicons name="search-outline" size={18} color={palette.textSoft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textSoft}
        style={[styles.input, compact && styles.compactInput]}
      />
      <View style={[styles.emblem, compact && styles.compactEmblem]}>
        <Ionicons name="sparkles-outline" size={18} color={palette.goldDeep} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: "#FFFDF8",
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    minHeight: 62,
  },
  compactWrapper: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: spacing.sm + 2,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 18,
    fontFamily: typography.bodyRegularFamily,
  },
  compactInput: {
    fontSize: 16,
  },
  emblem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(167,131,66,0.24)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,241,223,0.95)",
  },
  compactEmblem: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
