import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { AtelierCard } from "../ui/AtelierCard";
import { ProgressBar } from "../ui/ProgressBar";
import { BookCover } from "./BookCover";

export function HeroBookCard({ book, onPress, onContinue }) {
  const { isTablet } = useResponsive();

  return (
    <Pressable onPress={onPress}>
      <AtelierCard style={[styles.card, isTablet && styles.cardTablet]} tone="dark">
        <BookCover book={book} tall style={styles.cover} />
        <View style={styles.content}>
          <Text style={styles.eyebrow}>{book.source === "local" ? "En dispositivo" : "Continuar lectura"}</Text>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <View style={styles.metaRow}>
            {Array.isArray(book.genre)
              ? book.genre.slice(0, 2).map((genre) => (
                  <Text key={genre} style={styles.meta}>
                    {genre}
                  </Text>
                ))
              : null}
          </View>
          <Text style={styles.progressTitle}>Lectura en curso</Text>
          {book.progress > 0 ? (
            <View style={styles.progressWrap}>
              <ProgressBar value={book.progress} />
              <Text style={styles.progressLabel}>{Math.round(book.progress * 100)}% completado</Text>
            </View>
          ) : null}
        </View>
        <Pressable style={styles.arrowButton} onPress={onContinue}>
          <Ionicons name="chevron-forward" size={24} color="#D6B676" />
        </Pressable>
      </AtelierCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  cardTablet: {
    flexDirection: "row",
    alignItems: "center",
  },
  cover: {
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 13,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
    color: "#D1B06A",
  },
  title: {
    color: "#F7F1E6",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  author: {
    color: "#F0DDC0",
    fontFamily: typography.bodySemiBoldFamily,
    fontSize: 18,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  meta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,253,252,0.06)",
    color: "#E9E1D4",
    fontFamily: typography.labelFamily,
    fontSize: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,162,74,0.28)",
  },
  progressTitle: {
    color: "#D4B467",
    fontFamily: typography.labelFamily,
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  progressWrap: {
    gap: 6,
  },
  progressLabel: {
    color: "#CFC8BB",
    fontSize: 16,
    fontFamily: typography.bodyFamily,
  },
  arrowButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(201,162,74,0.38)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
