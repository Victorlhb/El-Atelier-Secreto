import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useInitializeLocalLibrary } from "../hooks/useLocalLibrary";

export function AppProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  useInitializeLocalLibrary();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}
