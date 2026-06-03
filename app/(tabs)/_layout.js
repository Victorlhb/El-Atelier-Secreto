import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { palette, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";

export default function TabsLayout() {
  const { isTablet, contentWidth } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E0B96F",
        tabBarInactiveTintColor: "#C7B796",
        tabBarStyle: {
          backgroundColor: palette.ink,
          borderTopColor: "rgba(200,156,78,0.28)",
          height: isTablet ? 82 : 74,
          paddingBottom: isTablet ? 12 : 9,
          paddingTop: isTablet ? 10 : 8,
          width: isTablet ? Math.min(contentWidth, 760) : "100%",
          alignSelf: "center",
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 1,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 11,
          fontFamily: typography.labelFamily,
          fontWeight: "700",
          letterSpacing: isTablet ? 0.8 : 0.6,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Descubrir",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          title: "Importar",
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Biblioteca",
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
