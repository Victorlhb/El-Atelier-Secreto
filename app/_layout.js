import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Cinzel_600SemiBold, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { AppProviders } from "../components/AppProviders";
import { palette } from "../constants/theme";

function RootNavigator() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="reader/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FantasyDisplay: Cinzel_700Bold,
    FantasyDisplayAlt: Cinzel_600SemiBold,
    FantasyBody: CormorantGaramond_500Medium,
    FantasyBodyRegular: CormorantGaramond_400Regular,
    FantasyBodySemiBold: CormorantGaramond_600SemiBold,
    FantasyBodyBold: CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <ActivityIndicator color={palette.goldDeep} />
      </View>
    );
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
