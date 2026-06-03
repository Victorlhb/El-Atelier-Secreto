import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { BookCard } from "../../components/books/BookCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { AtelierButton } from "../../components/ui/AtelierButton";
import { SearchInput } from "../../components/ui/SearchInput";
import { spacing } from "../../constants/theme";
import { useLibraryShelves, useVisibleBookMetadata } from "../../hooks/useBooks";
import { useAppStore } from "../../store/useAppStore";

export default function LibraryScreen() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const shelves = useLibraryShelves();
  const recent = useMemo(() => shelves.data?.recent ?? [], [shelves.data?.recent]);
  const favorites = useMemo(() => shelves.data?.favorites ?? [], [shelves.data?.favorites]);
  const inProgress = useMemo(() => shelves.data?.inProgress ?? [], [shelves.data?.inProgress]);
  const currentReading = inProgress[0] || recent.find((book) => book.progress > 0) || null;

  const savedBooks = useMemo(() => {
    const seen = new Set();
    const combined = [];

    for (const book of favorites) {
      if (!book?.id || seen.has(book.id)) {
        continue;
      }

      seen.add(book.id);
      combined.push(book);
    }

    return combined;
  }, [favorites]);

  const normalizedQuery = searchValue.trim().toLowerCase();
  const filteredCurrentReading = useMemo(() => {
    if (!currentReading) {
      return null;
    }

    if (!normalizedQuery) {
      return currentReading;
    }

    const haystack = [currentReading.title, currentReading.author, ...(Array.isArray(currentReading.genre) ? currentReading.genre : [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery) ? currentReading : null;
  }, [currentReading, normalizedQuery]);
  const filteredSavedBooks = useMemo(() => {
    if (!normalizedQuery) {
      return savedBooks;
    }

    return savedBooks.filter((book) => {
      const haystack = [book.title, book.author, ...(Array.isArray(book.genre) ? book.genre : [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [savedBooks, normalizedQuery]);
  const visibleBooks = useMemo(
    () => [...(filteredCurrentReading ? [filteredCurrentReading] : []), ...filteredSavedBooks],
    [filteredCurrentReading, filteredSavedBooks]
  );

  useVisibleBookMetadata(visibleBooks);

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        style={styles.list}
        data={filteredSavedBooks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
            detail={`${item.genre?.[0] || item.format} / ${item.pages > 0 ? `${item.pages} pags.` : "Local"}`}
            compact
            variant="library"
            showProgress
            actions={
              <>
                <AtelierButton
                  label="Leer"
                  onPress={() => router.push(`/reader/${item.id}`)}
                  style={styles.inlineRead}
                />
                <AtelierButton
                  label="Quitar"
                  onPress={() => toggleFavorite(item.id)}
                  variant="secondary"
                  style={styles.inlineSave}
                />
              </>
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.stack}>
            <AtelierTopBar rightIcon={null} emblem="library-outline" />

            <AtelierBanner
              title="Biblioteca guardada"
              description="Aqui descansan tus tomos elegidos y la lectura que sigue abierta en este dispositivo."
              icon="library-outline"
              compact
            />

            <AtelierCard tone="alt" style={styles.searchCard}>
              <SearchInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder="Buscar en tu estante"
                compact
              />
            </AtelierCard>

            {filteredCurrentReading ? (
              <View style={styles.sectionBlock}>
                <SectionHeader
                  eyebrow="En lectura"
                  title="Lectura en curso"
                  description="Tu tomo abierto espera aqui para retomarlo sin rodeos."
                  framed={false}
                  compact
                  inverted
                />
                <BookCard
                  book={filteredCurrentReading}
                  onPress={() => router.push(`/book/${filteredCurrentReading.id}`)}
                  detail={`${filteredCurrentReading.genre?.[0] || filteredCurrentReading.format} / ${filteredCurrentReading.pages > 0 ? `${filteredCurrentReading.pages} pags.` : "Local"}`}
                  compact
                  variant="library"
                  showProgress
                  actions={
                    <>
                      <AtelierButton
                        label="Leer"
                        onPress={() => router.push(`/reader/${filteredCurrentReading.id}`)}
                        style={styles.inlineRead}
                      />
                      <AtelierButton
                        label={favoriteIds.includes(filteredCurrentReading.id) ? "Quitar" : "Guardar"}
                        onPress={() => toggleFavorite(filteredCurrentReading.id)}
                        variant="secondary"
                        style={styles.inlineSave}
                      />
                    </>
                  }
                />
              </View>
            ) : null}

            <SectionHeader
              eyebrow="Guardados"
              title="Tu estante"
              description="Solo los tomos que has querido apartar para conservarlos a mano."
              framed={false}
              compact
              inverted
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {filteredSavedBooks.length === 0 ? (
              <EmptyState
                title={normalizedQuery ? "No hay tomos que coincidan" : "Todavia no has guardado tomos"}
                description={
                  normalizedQuery
                    ? "Prueba otro termino para filtrar los libros guardados en tu estante."
                    : "Desde Descubrir podras marcar los libros que quieras conservar en esta biblioteca."
                }
              />
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
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
  sectionBlock: {
    gap: spacing.sm,
  },
  searchCard: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  inlineRead: {
    flex: 1,
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
  },
  inlineSave: {
    flex: 1,
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
  },
});
