import { StyleSheet, View } from "react-native";
import { LocalLibraryPanel } from "../../components/books/LocalLibraryPanel";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { spacing } from "../../constants/theme";
import { useLocalLibraryImport, useLocalLibraryStats } from "../../hooks/useLocalLibrary";
import { useAppStore } from "../../store/useAppStore";

export default function RecentScreen() {
  const localLibraryState = useAppStore((state) => state.localLibrary);
  const localStats = useLocalLibraryStats();
  const importLocalLibrary = useLocalLibraryImport();

  return (
    <ScreenContainer edges={["top"]}>
      <View style={styles.content}>
        <AtelierTopBar rightIcon={null} emblem="folder-open-outline" />

        <AtelierBanner
          title="Importar tomos"
          description="Elige una carpeta del dispositivo y deja que el atelier ordene tus libros para buscarlos despues en Descubrir."
          icon="folder-open-outline"
          compact
        />

        <LocalLibraryPanel
          stats={localStats.data}
          state={localLibraryState}
          loading={importLocalLibrary.isPending}
          onImport={() => importLocalLibrary.mutate()}
          variant="library"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
