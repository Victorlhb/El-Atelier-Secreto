import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { BookCard } from "../../components/books/BookCard";
import { LocalLibraryPanel } from "../../components/books/LocalLibraryPanel";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { spacing } from "../../constants/theme";
import { useLibraryShelves } from "../../hooks/useBooks";
import { useLocalLibraryImport, useLocalLibraryStats } from "../../hooks/useLocalLibrary";
import { useAppStore } from "../../store/useAppStore";

export default function LibraryScreen() {
  const router = useRouter();
  const localLibraryState = useAppStore((state) => state.localLibrary);
  const shelves = useLibraryShelves();
  const localStats = useLocalLibraryStats();
  const importLocalLibrary = useLocalLibraryImport();

  const inProgress = shelves.data?.inProgress ?? [];
  const favorites = shelves.data?.favorites ?? [];
  const featuredData = (inProgress.length > 0 ? inProgress : favorites).slice(0, 24);
  const showingInProgress = inProgress.length > 0;

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        data={featuredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
            detail={`${item.genre?.[0] || item.format} / ${item.pages > 0 ? `${item.pages} pags.` : "Local"}`}
            showProgress={showingInProgress}
          />
        )}
        ListHeaderComponent={
          <View style={styles.stack}>
            <AtelierTopBar rightIcon={null} emblem="library-outline" />

            <AtelierBanner
              title="Biblioteca local"
              description="Tus mesas de lectura, guardados y estantes viven aqui sin depender de la nube."
              icon="library-outline"
            />

            <LocalLibraryPanel
              stats={localStats.data}
              state={localLibraryState}
              loading={importLocalLibrary.isPending}
              onImport={() => importLocalLibrary.mutate()}
              variant="library"
            />

            <SectionHeader
              eyebrow={showingInProgress ? "En lectura" : "Guardados"}
              title={showingInProgress ? "Mesa de lectura" : "Rincon querido"}
              description={
                showingInProgress
                  ? "Tus tomos abiertos permanecen juntos para retomarlos sin buscar de nuevo."
                  : "Los tomos que has marcado vuelven a este estante privado."
              }
              framed={false}
              compact
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {featuredData.length === 0 ? (
              <EmptyState
                title="Todavia no has reunido tomos aqui"
                description="Importa una carpeta o marca algunos libros para que este estante empiece a tomar forma."
              />
            ) : null}

            {showingInProgress && favorites.length > 0 ? (
              <View style={styles.favoriteStack}>
                <SectionHeader
                  eyebrow="Guardados"
                  title="Rincon querido"
                  description="Tus favoritos siguen a mano aunque la lectura principal este en marcha."
                  framed={false}
                  compact
                />
                <View style={styles.compactList}>
                  {favorites.slice(0, 4).map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onPress={() => router.push(`/book/${book.id}`)}
                      detail="Guardado en tu rincon"
                      showProgress={false}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={styles.content}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={7}
        removeClippedSubviews
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stack: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  favoriteStack: {
    gap: spacing.md,
  },
  compactList: {
    gap: spacing.md,
  },
});
