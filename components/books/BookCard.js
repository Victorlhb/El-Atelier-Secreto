import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { ProgressBar } from "../ui/ProgressBar";
import { AtelierCard } from "../ui/AtelierCard";
import { BookCover } from "./BookCover";

export function BookCard({
  book,
  onPress,
  detail,
  accessory,
  actions,
  showProgress = true,
  compact = false,
  variant = "default",
}) {
  const { isTablet } = useResponsive();
  const isLibrary = variant === "library";
  const genres = Array.isArray(book.genre) ? book.genre : [];
  const fallbackParts = [
    genres.length > 0 ? genres.join(" / ") : "",
    book.pages > 0 ? `${book.pages} pags.` : "",
    Boolean(book.language) && String(book.language).toLowerCase() !== "es" ? book.language.toUpperCase() : "",
    Boolean(book.format) && String(book.format).toUpperCase() !== "MOBI" ? book.format : "",
  ].filter(Boolean);
  const fallbackDetail =
    fallbackParts.length > 0 ? fallbackParts.join(" / ") : "Tomo guardado";

  return (
    <Pressable onPress={onPress}>
      <AtelierCard
        style={[styles.card, compact && styles.cardCompact, isLibrary && styles.cardLibrary, isLibrary && isTablet && styles.cardLibraryTablet]}
        tone="alt"
      >
        <BookCover
          book={book}
          style={[compact && styles.coverCompact, isLibrary && styles.coverLibrary, isLibrary && isTablet && styles.coverLibraryTablet]}
        />
        <View style={[styles.content, compact && styles.contentCompact, isLibrary && styles.contentLibrary]}>
          <Text
            style={[styles.title, compact && styles.titleCompact, isLibrary && styles.titleLibrary, isLibrary && isTablet && styles.titleLibraryTablet]}
            numberOfLines={compact ? 2 : undefined}
          >
            {book.title}
          </Text>
          <Text
            style={[styles.detail, compact && styles.detailCompact, isLibrary && styles.detailLibrary, isLibrary && isTablet && styles.detailLibraryTablet]}
            numberOfLines={compact ? 1 : 2}
          >
            {detail || fallbackDetail}
          </Text>
          {showProgress && book.progress > 0 ? (
            <View style={[styles.progressWrap, isLibrary && styles.progressWrapLibrary]}>
              <ProgressBar value={book.progress} />
              <Text
                style={[
                  styles.progressLabel,
                  compact && styles.progressLabelCompact,
                  isLibrary && styles.progressLabelLibrary,
                  isLibrary && isTablet && styles.progressLabelLibraryTablet,
                ]}
              >
                {Math.round(book.progress * 100)}% leido
              </Text>
            </View>
          ) : null}
          {actions ? (
            <View
              style={[
                styles.actions,
                compact && styles.actionsCompact,
                isLibrary && styles.actionsLibrary,
                isLibrary && isTablet && styles.actionsLibraryTablet,
              ]}
            >
              {actions}
            </View>
          ) : null}
          {accessory}
        </View>
        {!isLibrary ? (
          <View style={[styles.metaRail, compact && styles.metaRailCompact]}>
            {Boolean(book.format) && String(book.format).toUpperCase() !== "MOBI" ? (
              <Text style={[styles.badge, compact && styles.badgeCompact]}>{book.format}</Text>
            ) : null}
            {book.rating > 0 ? <Text style={[styles.rating, compact && styles.ratingCompact]}>{"\u2605"} {String(book.rating).replace(".", ",")}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={palette.goldDeep} />
          </View>
        ) : null}
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
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  cardLibrary: {
    gap: 10,
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 9,
    alignItems: "center",
  },
  cardLibraryTablet: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  coverCompact: {
    width: 54,
    height: 80,
  },
  coverLibrary: {
    width: 48,
    height: 72,
  },
  coverLibraryTablet: {
    width: 58,
    height: 86,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  contentCompact: {
    gap: 2,
  },
  contentLibrary: {
    gap: 3,
    justifyContent: "center",
  },
  title: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  titleLibrary: {
    fontSize: 15,
    lineHeight: 19,
  },
  titleLibraryTablet: {
    fontSize: 17,
    lineHeight: 21,
  },
  detail: {
    color: palette.textSoft,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 16,
    lineHeight: 22,
  },
  detailCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  detailLibrary: {
    fontSize: 11,
    lineHeight: 14,
  },
  detailLibraryTablet: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressWrap: {
    gap: 6,
    marginTop: 4,
  },
  progressWrapLibrary: {
    gap: 4,
    marginTop: 3,
  },
  progressLabel: {
    color: palette.textSoft,
    fontSize: 14,
    fontFamily: typography.bodyFamily,
  },
  progressLabelCompact: {
    fontSize: 11,
  },
  progressLabelLibrary: {
    fontSize: 10,
  },
  progressLabelLibraryTablet: {
    fontSize: 11,
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
  actionsLibrary: {
    gap: 6,
    marginTop: 6,
    width: "100%",
    flexWrap: "nowrap",
  },
  actionsLibraryTablet: {
    width: "auto",
  },
  metaRail: {
    alignItems: "flex-end",
    gap: 8,
    minWidth: 54,
    paddingTop: 4,
  },
  metaRailCompact: {
    gap: 3,
    minWidth: 40,
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
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  rating: {
    color: palette.goldDeep,
    fontSize: 16,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  ratingCompact: {
    fontSize: 12,
  },
});
