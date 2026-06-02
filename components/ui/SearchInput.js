import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";

export function SearchInput({ value, onChangeText, placeholder = "Buscar por titulo, autora o saga" }) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="search-outline" size={18} color={palette.textSoft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textSoft}
        style={styles.input}
      />
      <View style={styles.emblem}>
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
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 18,
    fontFamily: typography.bodyRegularFamily,
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
});
