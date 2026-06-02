import { useMemo } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { BookGridTile } from "../../components/books/BookGridTile";
import { BookSearch } from "../../components/books/BookSearch";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { palette, spacing } from "../../constants/theme";
import { useBookSearch, useVisibleBookMetadata } from "../../hooks/useBooks";
import { useResponsive } from "../../hooks/useResponsive";
import { useAppStore } from "../../store/useAppStore";

export default function DiscoverScreen() {
  const router = useRouter();
  const { isTablet, isLargeTablet } = useResponsive();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeGenres = useAppStore((state) => state.activeGenres);
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const toggleGenre = useAppStore((state) => state.toggleGenre);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const shouldShowFilteredResults = Boolean(searchQuery.trim()) || activeGenres.length > 0;

  const search = useBookSearch({ enabled: true });
  const results = useMemo(
    () => search.data?.pages.flatMap((page) => page.items) || [],
    [search.data?.pages]
  );
  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const gridItemWidth = isLargeTablet ? 316 : isTablet ? 336 : undefined;

  useVisibleBookMetadata(results);

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        key={`discover-grid-${numColumns}`}
        style={styles.list}
        data={results}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <BookGridTile
              book={item}
              width={gridItemWidth}
              isSaved={favoriteIds.includes(item.id)}
              onPress={() => router.push(`/book/${item.id}`)}
              onRead={() => router.push(`/reader/${item.id}`)}
              onToggleSaved={() => toggleFavorite(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.stack}>
            <AtelierTopBar rightIcon={null} />

            <AtelierBanner
              title="Abre un tomo"
              description="Busca en tu dispositivo, reanuda la lectura y deja que el atelier ordene tus tomos sin salir del telefono."
              icon="sparkles-outline"
              compact
            />

            <BookSearch
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              activeGenres={activeGenres}
              onToggleGenre={toggleGenre}
            />

            <SectionHeader
              eyebrow="Dispositivo"
              title={shouldShowFilteredResults ? "Resultados del atelier" : "Todos tus tomos"}
              description={
                shouldShowFilteredResults
                  ? "Los tomos que responden a tu busqueda aparecen aqui."
                  : ""
              }
              framed={false}
              compact
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {search.isFetchingNextPage ? (
              <ActivityIndicator color={palette.goldDeep} />
            ) : null}

            {!search.isFetching && results.length === 0 ? (
              <EmptyState
                title={shouldShowFilteredResults ? "No encontramos coincidencias" : ""}
                description={
                  shouldShowFilteredResults
                    ? "Prueba otro termino o una categoria distinta para seguir buscando en tu biblioteca."
                    : "Importa una carpeta local para poblar este estante completo."
                }
              />
            ) : null}

          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={styles.content}
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) {
            search.fetchNextPage();
          }
        }}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
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
  list: {
    flex: 1,
  },
  stack: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  gridRow: {
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  gridItem: {
    flex: 1,
    width: "100%",
    marginBottom: spacing.md,
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
});
