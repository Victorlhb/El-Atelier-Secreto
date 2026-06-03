import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { bookGenres } from "../../constants/mockData";
import { palette, spacing, typography } from "../../constants/theme";
import { useResponsive } from "../../hooks/useResponsive";
import { AtelierCard } from "../ui/AtelierCard";
import { SearchInput } from "../ui/SearchInput";
import { TagChip } from "../ui/TagChip";

export function BookSearch({
  query,
  onChangeQuery,
  activeGenres,
  onToggleGenre,
  compact = false,
}) {
  const { isTablet } = useResponsive();
  const [genresOpen, setGenresOpen] = useState(false);
  const resolvedCompact = compact || !isTablet;

  useEffect(() => {
    if (activeGenres.length > 0) {
      setGenresOpen(true);
    }
  }, [activeGenres.length]);

  return (
    <AtelierCard tone="alt" style={resolvedCompact && styles.cardCompact}>
      <View style={[styles.container, resolvedCompact && styles.containerCompact]}>
        <SearchInput value={query} onChangeText={onChangeQuery} compact={resolvedCompact} />
        <View style={[styles.genreBlock, resolvedCompact && styles.genreBlockCompact]}>
          <Pressable style={styles.genreToggle} onPress={() => setGenresOpen((current) => !current)}>
            <View style={styles.genreHeader}>
              <View style={styles.rule} />
              <Text style={[styles.genreTitle, resolvedCompact && styles.genreTitleCompact]}>
                Generos{activeGenres.length > 0 ? ` (${activeGenres.length})` : ""}
              </Text>
              <View style={styles.rule} />
            </View>
            <Ionicons
              name={genresOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={palette.goldDeep}
            />
          </Pressable>

          {genresOpen ? (
            <View style={[styles.genres, resolvedCompact && styles.genresCompact]}>
              {bookGenres.map((genre) => (
                <TagChip
                  key={genre}
                  label={genre}
                  active={activeGenres.includes(genre)}
                  onPress={() => onToggleGenre(genre)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </AtelierCard>
  );
}

const styles = StyleSheet.create({
  cardCompact: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  container: {
    gap: spacing.md,
  },
  containerCompact: {
    gap: spacing.sm,
  },
  genreBlock: {
    gap: spacing.sm,
  },
  genreBlockCompact: {
    gap: spacing.xs,
  },
  genreToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  genres: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  genresCompact: {
    gap: spacing.xs,
  },
  genreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(138,103,41,0.22)",
  },
  genreTitle: {
    color: palette.goldDeep,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  genreTitleCompact: {
    fontSize: 12,
    letterSpacing: 1.3,
  },
});
