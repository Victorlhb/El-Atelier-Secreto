import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { palette, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";

const atelierLogo = require("../../assets/branding/atelier-logo.jpg");

export function AtelierTopBar({ rightIcon = "person-circle-outline", onRightPress }) {
  const { isTablet } = useResponsive();

  return (
    <View style={styles.row}>
      <View style={[styles.logoFrame, !isTablet && styles.logoFrameMobile]}>
        <Image source={atelierLogo} style={styles.logoImage} resizeMode="cover" />
      </View>
      <View style={styles.brandWrap}>
        <View style={styles.line} />
        <Text style={[styles.brand, !isTablet && styles.brandMobile]}>El Atelier Secreto</Text>
        <View style={styles.line} />
      </View>
      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.iconButton}>
          <Ionicons name={rightIcon} size={isTablet ? 22 : 20} color={palette.goldDeep} />
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
  logoFrame: {
    width: 38,
    height: 54,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(188, 200, 78, 0.62)",
    backgroundColor: "#3E2A1D",
  },
  logoFrameMobile: {
    width: 34,
    height: 48,
    borderRadius: 9,
  },
  logoImage: {
    width: "100%",
    height: "100%",
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
  brandMobile: {
    fontSize: 18,
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 34,
    alignItems: "flex-end",
  },
  iconSpacer: {
    width: 34,
  },
});
