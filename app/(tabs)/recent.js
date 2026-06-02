import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { BookCard } from "../../components/books/BookCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { spacing } from "../../constants/theme";
import { useLibraryShelves } from "../../hooks/useBooks";

export default function RecentScreen() {
  const router = useRouter();
  const shelves = useLibraryShelves();
  const recent = shelves.data?.recent ?? [];

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
            detail={`${item.genre?.[0] || item.format} / ${item.pages > 0 ? `${item.pages} pags.` : "Local"}`}
            showProgress={false}
          />
        )}
        ListHeaderComponent={
          <View style={styles.stack}>
            <AtelierTopBar rightIcon={null} emblem="time-outline" />

            <AtelierBanner
              title="Recientes"
              description="Los tomos que acaban de pasar por tu mesa reaparecen aqui primero, sin ruido y sin cargar la biblioteca entera."
              icon="time-outline"
            />

            <SectionHeader
              eyebrow="Dispositivo"
              title="Tomos cercanos"
              description="Una estanteria ligera para volver rapido a lo ultimo que has traido al atelier."
              framed={false}
              compact
            />
          </View>
        }
        ListFooterComponent={
          recent.length === 0 ? (
            <View style={styles.footer}>
              <EmptyState
                title="Aun no hay tomos recientes"
                description="Importa una carpeta local y este estante empezara a poblarse enseguida."
              />
            </View>
          ) : null
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
    paddingTop: spacing.md,
  },
});
