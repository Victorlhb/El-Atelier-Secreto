import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
import { useBookDetail, useVisibleBookMetadata } from "../../hooks/useBooks";
import { useDeleteLocalBook } from "../../hooks/useLocalLibrary";
import { buildReaderDocument } from "../../lib/bookReader";
import { useAppStore } from "../../store/useAppStore";

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
  const sourceLabel = book.sourceLabel || "En dispositivo";
  const shouldShowLanguage = Boolean(book.language) && String(book.language).toLowerCase() !== "es";
  const shouldShowFormat = Boolean(book.format) && String(book.format).toUpperCase() !== "MOBI";
  const shouldShowPreview = previewSource === "epub" && previewParagraphs.length > 0;

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

      <AtelierBanner
        title={book.title}
        description={`Un tomo de ${book.author} guardado en tu dispositivo.`}
        icon="book-outline"
        compact
      />

      <AtelierCard style={styles.hero}>
        <BookCover book={book} tall />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{`${book.author} / ${sourceLabel}`}</Text>
          <View style={styles.metaRow}>
            <TagChip label={book.pages > 0 ? `${book.pages} paginas` : "Paginas sin contar"} active />
            {shouldShowLanguage ? <TagChip label={book.language.toUpperCase()} /> : null}
            {shouldShowFormat ? <TagChip label={book.format} /> : null}
            {book.tone ? <TagChip label={book.tone} /> : null}
          </View>
          <View style={styles.actions}>
            <AtelierButton label="Abrir el tomo" onPress={() => router.push(`/reader/${book.id}`)} />
            <AtelierButton
              label={isFavorite ? "Quitar del rincon" : "Llevar al rincon"}
              variant="secondary"
              onPress={() => toggleFavorite(book.id)}
            />
            <AtelierButton
              label={deleteLocalBook.isPending ? "Eliminando..." : "Borrar del dispositivo"}
              variant="secondary"
              onPress={handleDelete}
              disabled={deleteLocalBook.isPending}
            />
          </View>
        </View>
      </AtelierCard>

      <SectionHeader eyebrow="Taller" title="Guardar y abrir" framed={false} compact inverted />
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
