import { useMemo } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { BookCard } from "../../components/books/BookCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { AtelierButton } from "../../components/ui/AtelierButton";
import { spacing } from "../../constants/theme";
import { useLibraryShelves, useVisibleBookMetadata } from "../../hooks/useBooks";
import { useAppStore } from "../../store/useAppStore";

export default function LibraryScreen() {
  const router = useRouter();
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

  useVisibleBookMetadata(savedBooks);

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        style={styles.list}
        data={savedBooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
            detail={`${item.genre?.[0] || item.format} / ${item.pages > 0 ? `${item.pages} pags.` : "Local"}`}
            compact
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

            {currentReading ? (
              <View style={styles.sectionBlock}>
                <SectionHeader
                  eyebrow="En lectura"
                  title="Lectura en curso"
                  description="Tu tomo abierto espera aqui para retomarlo sin rodeos."
                  framed={false}
                  compact
                />
                <BookCard
                  book={currentReading}
                  onPress={() => router.push(`/book/${currentReading.id}`)}
                  detail={`${currentReading.genre?.[0] || currentReading.format} / ${currentReading.pages > 0 ? `${currentReading.pages} pags.` : "Local"}`}
                  compact
                  showProgress
                  actions={
                    <>
                      <AtelierButton
                        label="Leer"
                        onPress={() => router.push(`/reader/${currentReading.id}`)}
                        style={styles.inlineRead}
                      />
                      <AtelierButton
                        label={favoriteIds.includes(currentReading.id) ? "Quitar" : "Guardar"}
                        onPress={() => toggleFavorite(currentReading.id)}
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
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {savedBooks.length === 0 ? (
              <EmptyState
                title="Todavia no has guardado tomos"
                description="Desde Descubrir podras marcar los libros que quieras conservar en esta biblioteca."
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
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  inlineRead: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  inlineSave: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
});
