import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { bookGenres } from "../../constants/mockData";
import { palette, spacing, typography } from "../../constants/theme";
import { AtelierCard } from "../ui/AtelierCard";
import { SearchInput } from "../ui/SearchInput";
import { TagChip } from "../ui/TagChip";

export function BookSearch({
  query,
  onChangeQuery,
  activeGenres,
  onToggleGenre,
}) {
  const [genresOpen, setGenresOpen] = useState(false);

  useEffect(() => {
    if (activeGenres.length > 0) {
      setGenresOpen(true);
    }
  }, [activeGenres.length]);

  return (
    <AtelierCard tone="alt">
      <View style={styles.container}>
        <SearchInput value={query} onChangeText={onChangeQuery} />
        <View style={styles.genreBlock}>
          <Pressable style={styles.genreToggle} onPress={() => setGenresOpen((current) => !current)}>
            <View style={styles.genreHeader}>
              <View style={styles.rule} />
              <Text style={styles.genreTitle}>
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
            <View style={styles.genres}>
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
  container: {
    gap: spacing.md,
  },
  genreBlock: {
    gap: spacing.sm,
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
});
