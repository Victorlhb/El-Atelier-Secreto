import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BookCover } from "../../components/books/BookCover";
import { AtelierButton } from "../../components/ui/AtelierButton";
import { AtelierBanner } from "../../components/ui/AtelierBanner";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { AtelierTopBar } from "../../components/ui/AtelierTopBar";
import { TagChip } from "../../components/ui/TagChip";
import { palette, spacing, typography } from "../../constants/theme";
import { useBookDetail, useVisibleBookMetadata } from "../../hooks/useBooks";
import { useDeleteLocalBook } from "../../hooks/useLocalLibrary";
import { buildReaderDocument } from "../../lib/bookReader";
import { useAppStore } from "../../store/useAppStore";

function hasSpecificDescription(description) {
  const value = String(description || "").trim();
  return Boolean(value) && value !== "Sinopsis pendiente para este tomo.";
}

export default function BookDetailScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const { data: book, isLoading } = useBookDetail(id);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const removeFavorite = useAppStore((state) => state.removeFavorite);
  const [previewParagraphs, setPreviewParagraphs] = useState([]);
  const [previewSource, setPreviewSource] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const deleteLocalBook = useDeleteLocalBook();
  const isTablet = width >= 768;

  useVisibleBookMetadata(book ? [book] : []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!book) {
        return;
      }

      setPreviewLoading(true);

      try {
        const preview = await buildReaderDocument(book, {
          width: Math.min(width, 440),
          height: Math.min(height, 720),
          fontScale: 1,
          lineHeight: 1.8,
        });

        if (!cancelled) {
          setPreviewSource(preview.source || "");
          setPreviewParagraphs((preview.pages?.[0] || []).slice(0, 3));
        }
      } catch {
        if (!cancelled) {
          setPreviewSource("");
          setPreviewParagraphs([]);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [book, height, width]);

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
  const shouldShowLanguage = Boolean(book.language) && String(book.language).toLowerCase() !== "es";
  const shouldShowFormat = Boolean(book.format) && String(book.format).toUpperCase() !== "MOBI";
  const shouldShowPreview = (previewSource === "epub" || previewSource === "mobi") && previewParagraphs.length > 0;
  const showSynopsis = hasSpecificDescription(book.description);
  const detailTags = [
    book.pages > 0 ? `${book.pages} paginas` : "",
    genres[0] || "",
    shouldShowLanguage ? book.language.toUpperCase() : "",
    shouldShowFormat ? book.format : "",
  ].filter(Boolean);
  const secondaryTags = [
    ...genres.slice(1),
    book.collection && !/local/i.test(String(book.collection)) ? book.collection : "",
  ].filter(Boolean);

  const handleDelete = () => {
    Alert.alert(
      "Eliminar del dispositivo",
      "Este tomo se borrara del telefono y saldra tambien del atelier. Esta accion no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLocalBook.mutateAsync(book.id);
              removeFavorite(book.id);
              router.back();
            } catch (error) {
              Alert.alert(
                "No se pudo eliminar",
                error?.message || "El tomo no pudo borrarse del dispositivo."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <AtelierTopBar rightIcon={null} emblem="book-outline" />

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={18} color={palette.goldDeep} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      <AtelierBanner title={book.title} description={book.author} icon="book-outline" compact />

      <AtelierCard style={[styles.hero, isTablet && styles.heroTablet]}>
        <BookCover book={book} tall style={isTablet ? styles.heroCoverTablet : styles.heroCoverMobile} />
        <View style={styles.heroCopy}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>{book.title}</Text>
            <Text style={styles.heroAuthor}>{book.author}</Text>
          </View>

          {detailTags.length > 0 ? (
            <View style={styles.metaRow}>
              {detailTags.map((tag) => (
                <TagChip key={tag} label={tag} active />
              ))}
            </View>
          ) : null}

          {secondaryTags.length > 0 ? (
            <View style={styles.metaRow}>
              {secondaryTags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </View>
          ) : null}

          <View style={[styles.actions, isTablet && styles.actionsTablet]}>
            <AtelierButton
              label="Abrir el tomo"
              onPress={() => router.push(`/reader/${book.id}`)}
              style={styles.actionPrimary}
            />
            <AtelierButton
              label={isFavorite ? "Quitar del rincon" : "Llevar al rincon"}
              variant="secondary"
              onPress={() => toggleFavorite(book.id)}
              style={styles.actionSecondary}
            />
            <AtelierButton
              label={deleteLocalBook.isPending ? "Eliminando..." : "Borrar del dispositivo"}
              variant="secondary"
              onPress={handleDelete}
              disabled={deleteLocalBook.isPending}
              style={styles.actionDanger}
            />
          </View>
        </View>
      </AtelierCard>

      {showSynopsis ? (
        <AtelierCard style={styles.synopsis} tone="alt">
          <Text style={styles.sectionTitle}>Sobre este tomo</Text>
          <Text style={styles.body}>{book.description}</Text>
          <View style={styles.tagRow}>
            {book.rating > 0 ? <TagChip label={`Valoracion ${book.rating}`} /> : null}
            {book.readers > 0 ? <TagChip label={`${book.readers} lectores`} /> : null}
            {genres.length > 0 ? <TagChip label={genres.join(" / ")} /> : null}
          </View>
        </AtelierCard>
      ) : null}

      {previewLoading || shouldShowPreview ? (
        <AtelierCard style={styles.synopsis} tone="dark">
          <Text style={styles.sectionTitleDark}>Primera pagina</Text>
          {previewLoading ? <ActivityIndicator color={palette.goldDeep} /> : null}
          {shouldShowPreview
            ? previewParagraphs.map((paragraph) => (
                <Text key={paragraph} style={styles.bodyDark}>
                  {paragraph}
                </Text>
              ))
            : null}
        </AtelierCard>
      ) : null}
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
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  heroTablet: {
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  heroCoverMobile: {
    width: 112,
    height: 164,
  },
  heroCoverTablet: {
    width: 136,
    height: 196,
  },
  heroHeader: {
    gap: 4,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 29,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  heroAuthor: {
    color: palette.textSoft,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.bodySemiBoldFamily,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionsTablet: {
    gap: spacing.sm,
  },
  actionPrimary: {
    minHeight: 42,
  },
  actionSecondary: {
    minHeight: 42,
  },
  actionDanger: {
    minHeight: 42,
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
