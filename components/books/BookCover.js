import { memo, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { radii } from "../../constants/theme";

function BookCoverComponent({ book, tall = false, style }) {
  const colors = useMemo(
    () => book.coverPalette || ["#1A3026", "#3B5A46", "#C89C4E"],
    [book.coverPalette]
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const hasCoverImage = Boolean(book.cover_url) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
    setImageReady(false);
  }, [book.cover_url]);

  return (
    <View
      style={[
        styles.cover,
        tall ? styles.tall : styles.compact,
        {
          backgroundColor: colors[0],
          borderColor: colors[2],
        },
        style,
      ]}
    >
      {hasCoverImage ? (
        <Image
          source={{ uri: book.cover_url }}
          style={styles.image}
          resizeMode="cover"
          fadeDuration={120}
          onLoad={() => setImageReady(true)}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <View
        style={[
          styles.layer,
          {
            backgroundColor: colors[1],
            opacity: hasCoverImage ? (imageReady ? 0.04 : 0.12) : 0.26,
          },
        ]}
      />
      <View style={[styles.orbit, { borderColor: colors[2] }]} />
      <View style={[styles.topRibbon, { backgroundColor: colors[2] }]} />
      <View style={[styles.bottomRibbon, { backgroundColor: colors[2] }]} />
      <View style={styles.frame} />
      <View style={styles.innerFrame} />
      {!hasCoverImage ? <Text style={styles.spine}>{book.title}</Text> : null}
      {!hasCoverImage ? <Text style={styles.author}>{book.author}</Text> : null}
    </View>
  );
}

export const BookCover = memo(
  BookCoverComponent,
  (prevProps, nextProps) =>
    prevProps.tall === nextProps.tall &&
    prevProps.book.id === nextProps.book.id &&
    prevProps.book.cover_url === nextProps.book.cover_url &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.author === nextProps.book.author &&
    prevProps.book.coverPalette === nextProps.book.coverPalette &&
    prevProps.style === nextProps.style
);

const styles = StyleSheet.create({
  cover: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 12,
  },
  compact: {
    width: 86,
    height: 124,
  },
  tall: {
    width: 128,
    height: 188,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  orbit: {
    position: "absolute",
    top: -14,
    right: -10,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    opacity: 0.55,
  },
  topRibbon: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 18,
    height: 1,
    opacity: 0.6,
  },
  bottomRibbon: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 18,
    height: 1,
    opacity: 0.6,
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderWidth: 1,
    borderColor: "rgba(255,244,222,0.58)",
    borderRadius: radii.md,
  },
  innerFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 13,
    borderWidth: 1,
    borderColor: "rgba(200,156,78,0.48)",
    borderRadius: radii.md - 4,
  },
  spine: {
    color: "#F8EFDE",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 15,
  },
  author: {
    color: "rgba(248,239,222,0.92)",
    fontSize: 11,
  },
});
