import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { AtelierCard } from "../ui/AtelierCard";
import { AtelierButton } from "../ui/AtelierButton";
import { BookCover } from "./BookCover";

export function BookGridTile({
  book,
  onPress,
  onRead,
  onToggleSaved,
  isSaved = false,
  width,
}) {
  const { isTablet } = useResponsive();
  const detail = [book.genre?.[0], book.pages > 0 ? `${book.pages} pags.` : ""].filter(Boolean).join(" / ");

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pressable,
        styles.fullWidth,
        isTablet && width ? { width, maxWidth: width } : null,
      ]}
    >
      <AtelierCard tone="alt" style={[styles.card, isTablet ? styles.cardTablet : styles.cardMobile]}>
        <View style={styles.coverWrap}>
          <BookCover book={book} style={[styles.cover, isTablet && styles.coverTablet]} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, isTablet && styles.titleTablet]} numberOfLines={isTablet ? 2 : 3}>
            {book.title}
          </Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
          <View style={[styles.actions, !isTablet && styles.actionsMobile]}>
            <AtelierButton
              label="Leer"
              onPress={onRead}
              style={[styles.primaryAction, !isTablet && styles.mobileAction]}
              labelStyle={styles.actionLabel}
            />
            <AtelierButton
              label={isSaved ? "Guardado" : "Guardar"}
              onPress={onToggleSaved}
              variant="secondary"
              style={[styles.secondaryAction, !isTablet && styles.mobileAction]}
              labelStyle={styles.actionLabel}
            />
          </View>
        </View>
      </AtelierCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    width: "100%",
  },
  cardMobile: {
    minHeight: 134,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  cardTablet: {
    minHeight: 150,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  coverWrap: {
    paddingTop: 2,
  },
  cover: {
    width: 56,
    height: 82,
  },
  coverTablet: {
    width: 66,
    height: 96,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    minHeight: 82,
  },

  title: {
    color: "#1D160F",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  titleTablet: {
    fontSize: 17,
    lineHeight: 21,
  },
  detail: {
    color: "#53412E",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.bodySemiBoldFamily,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: "auto",
    flexWrap: "nowrap",
    alignItems: "center",
  },
  actionsMobile: {
    paddingTop: 4,
  },
  primaryAction: {
    minHeight: 32,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  secondaryAction: {
    minHeight: 32,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  mobileAction: {
    flexShrink: 1,
    minWidth: 78,
  },
  actionLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
