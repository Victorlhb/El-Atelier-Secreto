import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { palette, typography } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E0B96F",
        tabBarInactiveTintColor: "#C7B796",
        tabBarStyle: {
          backgroundColor: palette.ink,
          borderTopColor: "rgba(200,156,78,0.28)",
          height: 78,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: typography.labelFamily,
          fontWeight: "700",
          letterSpacing: 0.8,
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
          title: "Recientes",
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
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
