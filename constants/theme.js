import { Platform } from "react-native";

export const palette = {
  background: "#F2E7D4",
  backgroundAccent: "#E8DCC8",
  surface: "#FCF4E7",
  surfaceMuted: "#F1E2CC",
  card: "#FBF3E4",
  cardAlt: "#F7EAD4",
  text: "#2B241A",
  textSoft: "#675741",
  textMuted: "#8F7E69",
  line: "#D5BB8B",
  lineStrong: "#A78342",
  gold: "#C89C4E",
  goldDeep: "#8A6729",
  sage: "#31523F",
  sageDeep: "#173426",
  lilac: "#CFC3D8",
  lilacDeep: "#7F718E",
  aqua: "#9DC7C5",
  aquaDeep: "#4A8077",
  ink: "#112B20",
  success: "#5A8B69",
  danger: "#A35A46",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const shadows = Platform.select({
  ios: {
    shadowColor: "#23180A",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 6,
  },
  default: {
    shadowColor: "#23180A",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
});

export const typography = {
  displayFamily: "FantasyDisplay",
  displayAltFamily: "FantasyDisplayAlt",
  bodyFamily: "FantasyBody",
  bodyRegularFamily: "FantasyBodyRegular",
  bodySemiBoldFamily: "FantasyBodySemiBold",
  labelFamily: "FantasyBodyBold",
};
