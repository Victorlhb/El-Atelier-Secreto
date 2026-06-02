import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BookCover } from "../../components/books/BookCover";
import { DownloadButton } from "../../components/books/DownloadButton";
import { AtelierButton } from "../../components/ui/AtelierButton";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { TagChip } from "../../components/ui/TagChip";
import { palette, spacing, typography } from "../../constants/theme";
import { readerPreview } from "../../constants/mockData";
import { useBookDetail } from "../../hooks/useBooks";
import { useAppStore } from "../../store/useAppStore";

export default function BookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: book, isLoading } = useBookDetail(id);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  if (isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={palette.goldDeep} />
      </ScreenContainer>
    );
  }

  if (!book) {
    return (
      <ScreenContainer>
        <Text style={{ color: palette.text }}>Libro no encontrado.</Text>
      </ScreenContainer>
    );
  }

  const isFavorite = favoriteIds.includes(book.id);
  const genres = Array.isArray(book.genre) ? book.genre : [];
  const sourceLabel = book.sourceLabel || "En dispositivo";

  return (
    <ScreenContainer>
      <AtelierTopBar rightIcon={null} emblem="book-outline" />

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={18} color={palette.goldDeep} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      <AtelierBanner
        title={book.title}
        description={`Un tomo de ${book.author} guardado para abrirse en tu dispositivo cuando quieras.`}
        icon="book-outline"
        compact
      />

      <AtelierCard style={styles.hero}>
        <BookCover book={book} tall />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{`${book.author} / ${sourceLabel}`}</Text>
          <Text style={styles.description}>{book.description}</Text>
          <View style={styles.metaRow}>
            <TagChip label={book.pages > 0 ? `${book.pages} paginas` : "Paginas sin contar"} active />
            <TagChip label={book.language.toUpperCase()} />
            {book.format ? <TagChip label={book.format} /> : null}
            {book.tone ? <TagChip label={book.tone} /> : null}
          </View>
          <View style={styles.actions}>
            <AtelierButton label="Abrir el tomo" onPress={() => router.push(`/reader/${book.id}`)} />
            <AtelierButton
              label={isFavorite ? "Quitar del rincon" : "Llevar al rincon"}
              variant="secondary"
              onPress={() => toggleFavorite(book.id)}
            />
          </View>
        </View>
      </AtelierCard>

      <SectionHeader eyebrow="Taller" title="Guardar y abrir" framed={false} compact />
      <DownloadButton book={book} />

      <AtelierCard style={styles.synopsis} tone="alt">
        <Text style={styles.sectionTitle}>Sobre este tomo</Text>
        <Text style={styles.body}>{book.description}</Text>
        <View style={styles.tagRow}>
          {book.rating > 0 ? <TagChip label={`Valoracion ${book.rating}`} /> : null}
          {book.readers > 0 ? <TagChip label={`${book.readers} lectores`} /> : null}
          {genres.length > 0 ? <TagChip label={genres.join(" / ")} /> : null}
          <TagChip label={`Coleccion ${book.collection}`} />
        </View>
      </AtelierCard>

      <AtelierCard style={styles.synopsis} tone="dark">
        <Text style={styles.sectionTitleDark}>Primera pagina</Text>
        {readerPreview.map((paragraph) => (
          <Text key={paragraph} style={styles.bodyDark}>
            {paragraph}
          </Text>
        ))}
      </AtelierCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: palette.goldDeep,
    fontWeight: "700",
    fontFamily: typography.labelFamily,
  },
  hero: {
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: palette.goldDeep,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 12,
    fontFamily: typography.labelFamily,
  },
  description: {
    color: palette.textSoft,
    lineHeight: 24,
    fontSize: 18,
    fontFamily: typography.bodyRegularFamily,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  synopsis: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 24,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  sectionTitleDark: {
    color: "#F4EADB",
    fontSize: 24,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  body: {
    color: palette.textSoft,
    lineHeight: 24,
    fontSize: 17,
    fontFamily: typography.bodyRegularFamily,
  },
  bodyDark: {
    color: "#D9CCB4",
    lineHeight: 24,
    fontSize: 17,
    fontFamily: typography.bodyRegularFamily,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
