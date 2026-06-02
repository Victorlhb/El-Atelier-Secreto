import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../../constants/theme";
import { AtelierCard } from "../ui/AtelierCard";
import { AtelierButton } from "../ui/AtelierButton";
import { BookCover } from "./BookCover";

export function BookGridTile({
  book,
  onPress,
  onRead,
  onToggleSaved,
  isSaved = false,
  width = 160,
}) {
  const detail = [book.genre?.[0], book.pages > 0 ? `${book.pages} pags.` : ""].filter(Boolean).join(" / ");

  return (
    <Pressable onPress={onPress} style={[styles.pressable, width ? { width } : styles.fullWidth]}>
      <AtelierCard tone="alt" style={styles.card}>
        <View style={styles.coverWrap}>
          <BookCover book={book} style={styles.cover} />
        </View>
        <View style={styles.body}>
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>
          <Text style={styles.title} numberOfLines={3}>
            {book.title}
          </Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <AtelierButton label="Leer" onPress={onRead} style={styles.primaryAction} />
            <AtelierButton
              label={isSaved ? "Guardado" : "Guardar"}
              onPress={onToggleSaved}
              variant="secondary"
              style={styles.secondaryAction}
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
    minHeight: 168,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    width: "100%",
  },
  coverWrap: {
    paddingTop: 2,
  },
  cover: {
    width: 68,
    height: 100,
  },
  body: {
    flex: 1,
    gap: 3,
    minHeight: 100,
  },
  author: {
    color: palette.goldDeep,
    fontSize: 12,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.displayFamily,
    fontWeight: "700",
  },
  detail: {
    color: palette.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.bodyRegularFamily,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: "auto",
    flexWrap: "wrap",
  },
  primaryAction: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  secondaryAction: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
});
