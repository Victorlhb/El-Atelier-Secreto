import { StyleSheet, Text, View } from "react-native";
import { BookCover } from "../../components/books/BookCover";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { LocalLibraryPanel } from "../../components/books/LocalLibraryPanel";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { palette, spacing, typography } from "../../constants/theme";
import { useLocalLibraryImport, useLocalLibraryStats } from "../../hooks/useLocalLibrary";
import { useAppStore } from "../../store/useAppStore";

export default function RecentScreen() {
  const localLibraryState = useAppStore((state) => state.localLibrary);
  const localStats = useLocalLibraryStats();
  const importLocalLibrary = useLocalLibraryImport();
  const recentBooks = localStats.data?.recentBooks ?? [];

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

        <SectionHeader
          eyebrow="Mesa local"
          title="Prepara tu biblioteca"
          description="Indexa una carpeta del telefono y deja el catalogo listo para buscar y leer."
          framed={false}
          compact
          inverted
        />

        <LocalLibraryPanel
          stats={localStats.data}
          state={localLibraryState}
          loading={importLocalLibrary.isPending}
          onImport={() => importLocalLibrary.mutate()}
          variant="library"
        />

        {recentBooks.length > 0 ? (
          <AtelierCard tone="alt" style={styles.previewCard}>
            <Text style={styles.previewEyebrow}>Ultimos tomos</Text>
            <View style={styles.previewList}>
              {recentBooks.slice(0, 3).map((book) => (
                <View key={book.id} style={styles.previewRow}>
                  <BookCover book={book} style={styles.previewCover} />
                  <View style={styles.previewCopy}>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.previewAuthor} numberOfLines={1}>
                      {book.author}
                    </Text>
                    <Text style={styles.previewMeta} numberOfLines={1}>
                      {book.genre?.[0] || book.format} 
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </AtelierCard>
        ) : null}
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
  previewCard: {
    gap: spacing.sm,
  },
  previewEyebrow: {
    color: palette.goldDeep,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  previewList: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  previewCover: {
    width: 50,
    height: 74,
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewTitle: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  previewAuthor: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: typography.bodySemiBoldFamily,
  },
  previewMeta: {
    color: palette.goldDeep,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.bodyRegularFamily,
  },
});
