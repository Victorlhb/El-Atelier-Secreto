import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";
import { ProgressBar } from "../ui/ProgressBar";
import { AtelierCard } from "../ui/AtelierCard";
import { BookCover } from "./BookCover";

export function BookCard({ book, onPress, detail, accessory, showProgress = true }) {
  const genres = Array.isArray(book.genre) ? book.genre : [];
  const fallbackDetail =
    genres.length > 0
      ? `${genres.join(" / ")} / ${book.language.toUpperCase()}`
      : `${book.format} / ${book.source === "local" ? "En dispositivo" : book.language.toUpperCase()}`;

  return (
    <Pressable onPress={onPress}>
      <AtelierCard style={styles.card} tone="alt">
        <BookCover book={book} />
        <View style={styles.content}>
          <Text style={styles.kicker}>{book.author}</Text>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.detail} numberOfLines={2}>
            {detail || fallbackDetail}
          </Text>
          {showProgress && book.progress > 0 ? (
            <View style={styles.progressWrap}>
              <ProgressBar value={book.progress} />
              <Text style={styles.progressLabel}>{Math.round(book.progress * 100)}% leido</Text>
            </View>
          ) : null}
          {accessory}
        </View>
        <View style={styles.metaRail}>
          <Text style={styles.badge}>{book.format}</Text>
          {book.source === "local" ? <Text style={styles.localMark}>Local</Text> : null}
          {book.rating > 0 ? <Text style={styles.rating}>★ {String(book.rating).replace(".", ",")}</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={palette.goldDeep} />
        </View>
      </AtelierCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: palette.goldDeep,
    fontSize: 16,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  detail: {
    color: palette.textSoft,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 16,
    lineHeight: 22,
  },
  progressWrap: {
    gap: 6,
    marginTop: 4,
  },
  progressLabel: {
    color: palette.textSoft,
    fontSize: 14,
    fontFamily: typography.bodyFamily,
  },
  metaRail: {
    alignItems: "flex-end",
    gap: 8,
    minWidth: 54,
    paddingTop: 4,
  },
  badge: {
    borderWidth: 1,
    borderColor: "rgba(167,131,66,0.36)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: palette.sageDeep,
    fontSize: 12,
    fontFamily: typography.labelFamily,
    textTransform: "uppercase",
  },
  localMark: {
    color: palette.sage,
    fontSize: 13,
    fontFamily: typography.labelFamily,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  rating: {
    color: palette.goldDeep,
    fontSize: 16,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
});
