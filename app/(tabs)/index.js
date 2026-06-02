import { useMemo } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { BookCard } from "../../components/books/BookCard";
import { BookSearch } from "../../components/books/BookSearch";
import { HeroBookCard } from "../../components/books/HeroBookCard";
import { LocalLibraryPanel } from "../../components/books/LocalLibraryPanel";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { palette, spacing } from "../../constants/theme";
import { useBookSearch, useDiscoverShelves } from "../../hooks/useBooks";
import { useLocalLibraryImport, useLocalLibraryStats } from "../../hooks/useLocalLibrary";
import { useAppStore } from "../../store/useAppStore";

export default function DiscoverScreen() {
  const router = useRouter();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeGenres = useAppStore((state) => state.activeGenres);
  const localLibraryState = useAppStore((state) => state.localLibrary);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const toggleGenre = useAppStore((state) => state.toggleGenre);

  const shouldShowResults = Boolean(searchQuery.trim()) || activeGenres.length > 0;

  const shelves = useDiscoverShelves();
  const search = useBookSearch({ enabled: shouldShowResults });
  const localStats = useLocalLibraryStats();
  const importLocalLibrary = useLocalLibraryImport();
  const results = useMemo(
    () => (shouldShowResults ? search.data?.pages.flatMap((page) => page.items) || [] : []),
    [search.data?.pages, shouldShowResults]
  );
  const continueReading = shelves.data?.continueReading;
  const favorites = shelves.data?.favorites || [];

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        data={shouldShowResults ? results : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
            detail={
              item.source === "local"
                ? `${item.genre?.[0] || item.format} / ${item.pages > 0 ? `${item.pages} pags.` : "Local"}`
                : `${item.genre.join(" / ")} / ${item.pages} pags.`
            }
            showProgress={false}
          />
        )}
        ListHeaderComponent={
          <View style={styles.stack}>
            <AtelierTopBar rightIcon={null} />

            <AtelierBanner
              title="Abre un tomo"
              description="Busca en tu dispositivo, reanuda la lectura y deja que el atelier ordene tus tomos sin salir del telefono."
              icon="sparkles-outline"
            />

            <LocalLibraryPanel
              stats={localStats.data}
              state={localLibraryState}
              loading={importLocalLibrary.isPending}
              onImport={() => importLocalLibrary.mutate()}
              variant="discover"
            />

            <BookSearch
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              activeGenres={activeGenres}
              onToggleGenre={toggleGenre}
            />

            {continueReading ? (
              <HeroBookCard
                book={continueReading}
                onPress={() => router.push(`/book/${continueReading.id}`)}
                onContinue={() => router.push(`/reader/${continueReading.id}`)}
              />
            ) : null}

            {shouldShowResults ? (
              <SectionHeader
                eyebrow="Dispositivo"
                title="Resultados del atelier"
                description="Resultados ligeros para buscar sin cargar todos los tomos a la vez."
                framed={false}
                compact
              />
            ) : null}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {shouldShowResults && search.isFetchingNextPage ? (
              <ActivityIndicator color={palette.goldDeep} />
            ) : null}

            {shouldShowResults && !search.isFetching && results.length === 0 ? (
              <EmptyState
                title="No encontramos coincidencias"
                description="Prueba otro termino, otra categoria o cambia de origen para abrir mas caminos."
              />
            ) : null}

            {!shouldShowResults && favorites.length > 0 ? (
              <View style={styles.favoriteStack}>
                <SectionHeader
                  eyebrow="Guardados"
                  title="Rincon querido"
                  description="Tus tomos marcados vuelven aqui sin perder el ambiente del atelier."
                  framed={false}
                  compact
                />
                <View style={styles.compactList}>
                  {favorites.slice(0, 3).map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onPress={() => router.push(`/book/${book.id}`)}
                      detail={
                        book.source === "local"
                          ? "Favorito del dispositivo"
                          : `${book.genre.join(" / ")} / ${book.pages} pags.`
                      }
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
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (shouldShowResults && search.hasNextPage && !search.isFetchingNextPage) {
            search.fetchNextPage();
          }
        }}
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
