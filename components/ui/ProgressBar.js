import { StyleSheet, View } from "react-native";
import { radii } from "../../constants/theme";

export function ProgressBar({ value }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value * 100))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(235,222,198,0.3)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#5AA18F",
    borderRadius: radii.pill,
  },
});
