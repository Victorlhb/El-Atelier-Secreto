import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { palette, spacing } from "../constants/theme";

export default function NotFoundScreen() {
  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <Text style={styles.title}>Pantalla no encontrada</Text>
        <Text style={styles.text}>La ruta no existe dentro del atelier.</Text>
        <Link href="/" style={styles.link}>
          Volver al inicio
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
  },
  text: {
    color: palette.textSoft,
  },
  link: {
    color: palette.goldDeep,
    fontWeight: "700",
  },
});
