import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";
import { ProgressBar } from "../ui/ProgressBar";
import { AtelierCard } from "../ui/AtelierCard";
import { BookCover } from "./BookCover";

export function BookCard({ book, onPress, detail, accessory, actions, showProgress = true, compact = false }) {
  const genres = Array.isArray(book.genre) ? book.genre : [];
  const fallbackDetail =
    genres.length > 0
      ? `${genres.join(" / ")} / ${book.language.toUpperCase()}`
      : `${book.format} / ${book.source === "local" ? "En dispositivo" : book.language.toUpperCase()}`;

  return (
    <Pressable onPress={onPress}>
      <AtelierCard style={[styles.card, compact && styles.cardCompact]} tone="alt">
        <BookCover book={book} style={compact ? styles.coverCompact : undefined} />
        <View style={[styles.content, compact && styles.contentCompact]}>
          <Text style={[styles.kicker, compact && styles.kickerCompact]} numberOfLines={1}>
            {book.author}
          </Text>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 2 : undefined}>
            {book.title}
          </Text>
          <Text style={[styles.detail, compact && styles.detailCompact]} numberOfLines={compact ? 1 : 2}>
            {detail || fallbackDetail}
          </Text>
          {showProgress && book.progress > 0 ? (
            <View style={styles.progressWrap}>
              <ProgressBar value={book.progress} />
              <Text style={[styles.progressLabel, compact && styles.progressLabelCompact]}>
                {Math.round(book.progress * 100)}% leido
              </Text>
            </View>
          ) : null}
          {actions ? <View style={[styles.actions, compact && styles.actionsCompact]}>{actions}</View> : null}
          {accessory}
        </View>
        <View style={[styles.metaRail, compact && styles.metaRailCompact]}>
          <Text style={[styles.badge, compact && styles.badgeCompact]}>{book.format}</Text>
          {book.source === "local" ? <Text style={[styles.localMark, compact && styles.localMarkCompact]}>Local</Text> : null}
          {book.rating > 0 ? <Text style={[styles.rating, compact && styles.ratingCompact]}>{"\u2605"} {String(book.rating).replace(".", ",")}</Text> : null}
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
  cardCompact: {
    gap: spacing.sm,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  coverCompact: {
    width: 62,
    height: 92,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  contentCompact: {
    gap: 2,
  },
  kicker: {
    color: palette.goldDeep,
    fontSize: 16,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  kickerCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  titleCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  detail: {
    color: palette.textSoft,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 16,
    lineHeight: 22,
  },
  detailCompact: {
    fontSize: 13,
    lineHeight: 18,
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
  progressLabelCompact: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  actionsCompact: {
    gap: spacing.xs,
    marginTop: 4,
  },
  metaRail: {
    alignItems: "flex-end",
    gap: 8,
    minWidth: 54,
    paddingTop: 4,
  },
  metaRailCompact: {
    gap: 4,
    minWidth: 44,
    paddingTop: 1,
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
  badgeCompact: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  localMark: {
    color: palette.sage,
    fontSize: 13,
    fontFamily: typography.labelFamily,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  localMarkCompact: {
    fontSize: 10,
  },
  rating: {
    color: palette.goldDeep,
    fontSize: 16,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  ratingCompact: {
    fontSize: 13,
  },
});
