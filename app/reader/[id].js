import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { AtelierCard } from "../../components/ui/AtelierCard";
import { palette, spacing, typography } from "../../constants/theme";
import { useBookDetail } from "../../hooks/useBooks";
import { buildReaderDocument } from "../../lib/bookReader";
import { getReaderState, saveReaderState } from "../../lib/localLibrary";
import { useAppStore } from "../../store/useAppStore";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ReaderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { data: book, isLoading: bookLoading } = useBookDetail(id);
  const preferences = useAppStore((state) => state.readerPreferences);
  const updateReaderPreferences = useAppStore((state) => state.updateReaderPreferences);

  const [readerDocument, setReaderDocument] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [readerLoading, setReaderLoading] = useState(true);
  const [readerError, setReaderError] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chaptersVisible, setChaptersVisible] = useState(false);
  const progressRef = useRef(0);
  const pageIndexRef = useRef(0);
  const readerDocumentRef = useRef(null);
  const bookRef = useRef(null);
  const isTablet = width >= 768;
  const isNightMode = preferences.theme === "noche";
  const bottomControlInset = Math.max(insets.bottom + (isTablet ? spacing.sm : spacing.md), isTablet ? 20 : 24);
  const baseReaderFontSize = isTablet ? 22 : 21;
  const resolvedParagraphFamily =
    preferences.fontWeight === "strong" ? typography.bodySemiBoldFamily : typography.bodyRegularFamily;
  const pageViewport = useMemo(() => {
    const horizontalPadding = spacing.md * 4 + 36;
    const verticalReserve =
      insets.top +
      bottomControlInset +
      (isTablet ? 238 : 252);

    return {
      width: Math.max(width - horizontalPadding, 260),
      height: Math.max(height - verticalReserve, 280),
    };
  }, [bottomControlInset, height, insets.top, isTablet, width]);

  const persistCurrentState = async () => {
    const currentBook = bookRef.current;
    const currentDocument = readerDocumentRef.current;

    if (!currentBook || !currentDocument?.pageCount) {
      return;
    }

    const currentPageIndex = pageIndexRef.current;
    const progress =
      currentDocument.pageCount <= 1
        ? 1
        : currentPageIndex / Math.max(currentDocument.pageCount - 1, 1);

    progressRef.current = progress;

    await saveReaderState({
      bookId: currentBook.id,
      pageIndex: currentPageIndex,
      pageCount: currentDocument.pageCount,
      progress,
      location: `page:${currentPageIndex + 1}`,
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadReader() {
      if (!book) {
        return;
      }

      setReaderLoading(true);
      setReaderError("");

      try {
        const savedState = await getReaderState(book.id);
        const document = await buildReaderDocument(book, {
          width: pageViewport.width,
          height: pageViewport.height,
          baseFontSize: baseReaderFontSize,
          fontScale: preferences.fontScale,
          lineHeight: preferences.lineHeight,
          fontWeight: preferences.fontWeight,
        });

        if (cancelled) {
          return;
        }

        const maxPageIndex = Math.max(document.pageCount - 1, 0);
        const resumeProgress = progressRef.current || savedState.progress || 0;
        const initialPage =
          savedState.pageCount === document.pageCount && savedState.pageIndex <= maxPageIndex
            ? savedState.pageIndex
            : Math.round(resumeProgress * maxPageIndex);

        setReaderDocument(document);
        setPageIndex(clamp(initialPage, 0, maxPageIndex));
      } catch (error) {
        if (!cancelled) {
          setReaderError(error?.message || "No se pudo abrir el tomo.");
        }
      } finally {
        if (!cancelled) {
          setReaderLoading(false);
        }
      }
    }

    loadReader();
    return () => {
      cancelled = true;
    };
  }, [baseReaderFontSize, book, pageViewport.height, pageViewport.width, preferences.fontScale, preferences.fontWeight, preferences.lineHeight]);

  useEffect(() => {
    bookRef.current = book || null;
  }, [book]);

  useEffect(() => {
    readerDocumentRef.current = readerDocument || null;
  }, [readerDocument]);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    if (!book || !readerDocument?.pageCount) {
      return;
    }

    const progress =
      readerDocument.pageCount <= 1 ? 1 : pageIndex / Math.max(readerDocument.pageCount - 1, 1);
    progressRef.current = progress;

    const timeout = globalThis.setTimeout(() => {
      persistCurrentState().catch(() => {
        // Ignore persistence issues in the UI; the reader stays usable.
      });
    }, 250);

    return () => globalThis.clearTimeout(timeout);
  }, [book, pageIndex, readerDocument]);

  useEffect(() => {
    return () => {
      persistCurrentState().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["discover-shelves"] });
      queryClient.invalidateQueries({ queryKey: ["library-shelves"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["book", id] });
      }
    };
  }, [id, queryClient]);

  const pages = useMemo(() => readerDocument?.pages || [], [readerDocument?.pages]);
  const chapters = useMemo(() => readerDocument?.chapters || [], [readerDocument?.chapters]);
  const showChapters = chapters.length > 0;
  const currentPage = pages[pageIndex] || [];
  const pageLabel = useMemo(() => {
    if (!readerDocument?.pageCount) {
      return "0 / 0";
    }

    return `${pageIndex + 1} / ${readerDocument.pageCount}`;
  }, [pageIndex, readerDocument?.pageCount]);

  const handlePreviousPage = () => {
    setPageIndex((current) => clamp(current - 1, 0, Math.max(pages.length - 1, 0)));
  };

  const handleNextPage = () => {
    setPageIndex((current) => clamp(current + 1, 0, Math.max(pages.length - 1, 0)));
  };

  const handleExitReader = async () => {
    try {
      await persistCurrentState();
    } catch {
      // Ignore and still leave the reader.
    }

    router.back();
  };

  const handleIncreaseFontScale = () => {
    setReaderLoading(true);
    updateReaderPreferences({
      fontScale: preferences.fontScale >= 1.8 ? 1.8 : Number((preferences.fontScale + 0.1).toFixed(2)),
    });
  };

  const handleDecreaseFontScale = () => {
    setReaderLoading(true);
    updateReaderPreferences({
      fontScale: preferences.fontScale <= 1 ? 1 : Number((preferences.fontScale - 0.1).toFixed(2)),
    });
  };

  const handleIncreaseLineHeight = () => {
    setReaderLoading(true);
    updateReaderPreferences({
      lineHeight: preferences.lineHeight >= 2.15 ? 2.15 : Number((preferences.lineHeight + 0.1).toFixed(2)),
    });
  };

  const handleDecreaseLineHeight = () => {
    setReaderLoading(true);
    updateReaderPreferences({
      lineHeight: preferences.lineHeight <= 1.55 ? 1.55 : Number((preferences.lineHeight - 0.1).toFixed(2)),
    });
  };

  const handleToggleFontWeight = () => {
    setReaderLoading(true);
    updateReaderPreferences({
      fontWeight: preferences.fontWeight === "strong" ? "regular" : "strong",
    });
  };

  const handleJumpToChapter = (targetPageIndex) => {
    setChaptersVisible(false);
    setPageIndex(clamp(targetPageIndex, 0, Math.max(pages.length - 1, 0)));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 14,
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dx < -50) {
            setPageIndex((current) => clamp(current + 1, 0, Math.max(pages.length - 1, 0)));
            return;
          }

          if (gestureState.dx > 50) {
            setPageIndex((current) => clamp(current - 1, 0, Math.max(pages.length - 1, 0)));
          }
        },
      }),
    [pages.length]
  );

  if (bookLoading || readerLoading) {
    return (
      <ScreenContainer tone={isNightMode ? "night" : "paper"} scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.goldDeep} />
          <Text style={[styles.loadingText, isNightMode && styles.loadingTextNight]}>Preparando el tomo...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!book || readerError) {
    return (
      <ScreenContainer tone={isNightMode ? "night" : "paper"} scroll={false}>
        <View style={styles.centered}>
          <Text style={[styles.errorTitle, isNightMode && styles.errorTitleNight]}>No se pudo abrir este tomo</Text>
          <Text style={[styles.errorText, isNightMode && styles.errorTextNight]}>
            {readerError || "El libro no esta disponible."}
          </Text>
          <Pressable style={[styles.backButton, isNightMode && styles.backButtonNight]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, isNightMode && styles.backButtonTextNight]}>Volver</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer tone={isNightMode ? "night" : "paper"} scroll={false} edges={["top", "bottom"]}>
      <View style={styles.readerLayout}>
        <View style={[styles.chromeRow, isTablet && styles.chromeRowTablet]}>
          <Pressable style={styles.chromeButton} onPress={handleExitReader}>
            <Ionicons name="chevron-back" size={18} color={isNightMode ? "#E3D4B8" : palette.goldDeep} />
            <Text style={[styles.chromeLabel, isNightMode && styles.chromeLabelNight]}>Volver</Text>
          </Pressable>

          <View style={styles.chromeActions}>
            {showChapters ? (
              <Pressable
                style={[styles.preferenceChip, isNightMode && styles.preferenceChipNight]}
                onPress={() => setChaptersVisible(true)}
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={isNightMode ? "#F6E8BF" : palette.goldDeep}
                />
                <Text style={[styles.preferenceLabel, isNightMode && styles.preferenceLabelNight]}>Capitulos</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.preferenceChip, isNightMode && styles.preferenceChipNight]}
              onPress={() => setSettingsVisible(true)}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={isNightMode ? "#F6E8BF" : palette.goldDeep}
              />
              <Text style={[styles.preferenceLabel, isNightMode && styles.preferenceLabelNight]}>Ajustes</Text>
            </Pressable>
          </View>
        </View>

        <AtelierCard
          style={[styles.readerSurface, isTablet && styles.readerSurfaceTablet, isNightMode && styles.readerSurfaceNight]}
          tone={isNightMode ? "dark" : "alt"}
        >
          <View {...panResponder.panHandlers} style={[styles.pageSurface, isNightMode && styles.pageSurfaceNight]}>
            {currentPage.length === 0 ? (
              <Text style={[styles.emptyPage, isNightMode && styles.emptyPageNight]}>
                Este tomo no devolvio texto legible en esta vista. Prueba otro archivo o vuelve a importarlo.
              </Text>
            ) : null}
            {currentPage.map((paragraph, index) => (
              <Text
                key={`${pageIndex}-${index}`}
                style={[
                  styles.paragraph,
                  isNightMode && styles.paragraphNight,
                  {
                    fontFamily: resolvedParagraphFamily,
                    fontSize: baseReaderFontSize * preferences.fontScale,
                    lineHeight: baseReaderFontSize * preferences.fontScale * preferences.lineHeight,
                  },
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        </AtelierCard>

        <View style={[styles.footerShell, { paddingBottom: bottomControlInset }]}>
          <AtelierCard
            style={[styles.footerCard, isTablet && styles.footerCardTablet, isNightMode && styles.footerCardNight]}
            tone={isNightMode ? "dark" : "alt"}
          >
            <View style={styles.footerRow}>
              <Pressable
                style={[
                  styles.navButton,
                  isNightMode && styles.navButtonNight,
                  pageIndex === 0 && styles.navButtonDisabled,
                  pageIndex === 0 && isNightMode && styles.navButtonDisabledNight,
                ]}
                onPress={handlePreviousPage}
                disabled={pageIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={pageIndex === 0 ? (isNightMode ? "#6F6A5F" : palette.textMuted) : isNightMode ? "#F2E5C8" : palette.goldDeep}
                />
                <Text
                  style={[
                    styles.navLabel,
                    isNightMode && styles.navLabelNight,
                    pageIndex === 0 && styles.navLabelDisabled,
                    pageIndex === 0 && isNightMode && styles.navLabelDisabledNight,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              <View style={styles.progressWrap}>
                <Text style={[styles.progressLabel, isNightMode && styles.progressLabelNight]}>{pageLabel}</Text>
                <Text style={[styles.progressSubtle, isNightMode && styles.progressSubtleNight]}>
                  {readerDocument.source === "preview"
                    ? "Vista parcial del tomo"
                    : "Tu pagina se guarda al salir"}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.navButton,
                  isNightMode && styles.navButtonNight,
                  pageIndex >= pages.length - 1 && styles.navButtonDisabled,
                  pageIndex >= pages.length - 1 && isNightMode && styles.navButtonDisabledNight,
                ]}
                onPress={handleNextPage}
                disabled={pageIndex >= pages.length - 1}
              >
                <Text
                  style={[
                    styles.navLabel,
                    isNightMode && styles.navLabelNight,
                    pageIndex >= pages.length - 1 && styles.navLabelDisabled,
                    pageIndex >= pages.length - 1 && isNightMode && styles.navLabelDisabledNight,
                  ]}
                >
                  Siguiente
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    pageIndex >= pages.length - 1
                      ? isNightMode
                        ? "#6F6A5F"
                        : palette.textMuted
                      : isNightMode
                        ? "#F2E5C8"
                        : palette.goldDeep
                  }
                />
              </Pressable>
            </View>
          </AtelierCard>
        </View>
      </View>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsVisible(false)} />
          <AtelierCard
            style={[styles.chapterSheet, isNightMode && styles.chapterSheetNight]}
            tone={isNightMode ? "dark" : "alt"}
          >
            <View style={[styles.sheetHandle, isNightMode && styles.sheetHandleNight]} />
            <View style={styles.chapterHeader}>
              <Text style={[styles.chapterTitle, isNightMode && styles.chapterTitleNight]}>Ajustes</Text>
              <Pressable onPress={() => setSettingsVisible(false)} style={styles.chapterClose}>
                <Ionicons name="close" size={18} color={isNightMode ? "#E6D8BB" : palette.goldDeep} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.chapterList} showsVerticalScrollIndicator={false}>
              <View style={styles.settingGroup}>
                <Pressable
                  style={styles.settingRow}
                  onPress={() =>
                    updateReaderPreferences({
                      theme: isNightMode ? "pergamino" : "noche",
                    })
                  }
                >
                  <View style={styles.settingCopy}>
                    <Text style={[styles.chapterItemTitle, isNightMode && styles.chapterItemTitleNight]}>
                      Modo de lectura
                    </Text>
                    <Text style={[styles.chapterItemMeta, isNightMode && styles.chapterItemMetaNight]}>
                      {isNightMode ? "Oscuro" : "Pergamino"}
                    </Text>
                  </View>
                  <Ionicons
                    name={isNightMode ? "moon" : "sunny-outline"}
                    size={18}
                    color={isNightMode ? "#E8D5A1" : palette.goldDeep}
                  />
                </Pressable>
                <View style={styles.chapterSeparator} />
                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={[styles.chapterItemTitle, isNightMode && styles.chapterItemTitleNight]}>
                      Tamano
                    </Text>
                    <Text style={[styles.chapterItemMeta, isNightMode && styles.chapterItemMetaNight]}>
                      Escala {preferences.fontScale.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      style={[styles.stepperButton, isNightMode && styles.stepperButtonNight]}
                      onPress={handleDecreaseFontScale}
                    >
                      <Ionicons name="remove" size={16} color={isNightMode ? "#F0E0BE" : palette.goldDeep} />
                    </Pressable>
                    <Text style={[styles.stepperValue, isNightMode && styles.stepperValueNight]}>
                      A
                    </Text>
                    <Pressable
                      style={[styles.stepperButton, isNightMode && styles.stepperButtonNight]}
                      onPress={handleIncreaseFontScale}
                    >
                      <Ionicons name="add" size={16} color={isNightMode ? "#F0E0BE" : palette.goldDeep} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.chapterSeparator} />
                <Pressable style={styles.settingRow} onPress={handleToggleFontWeight}>
                  <View style={styles.settingCopy}>
                    <Text style={[styles.chapterItemTitle, isNightMode && styles.chapterItemTitleNight]}>
                      Grosor
                    </Text>
                    <Text style={[styles.chapterItemMeta, isNightMode && styles.chapterItemMetaNight]}>
                      {preferences.fontWeight === "strong" ? "Firme" : "Suave"}
                    </Text>
                  </View>
                  <Ionicons name="text" size={18} color={isNightMode ? "#E8D5A1" : palette.goldDeep} />
                </Pressable>
                <View style={styles.chapterSeparator} />
                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={[styles.chapterItemTitle, isNightMode && styles.chapterItemTitleNight]}>
                      Respiro
                    </Text>
                    <Text style={[styles.chapterItemMeta, isNightMode && styles.chapterItemMetaNight]}>
                      Interlineado {preferences.lineHeight.toFixed(1).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      style={[styles.stepperButton, isNightMode && styles.stepperButtonNight]}
                      onPress={handleDecreaseLineHeight}
                    >
                      <Ionicons name="remove" size={16} color={isNightMode ? "#F0E0BE" : palette.goldDeep} />
                    </Pressable>
                    <Text style={[styles.stepperValue, isNightMode && styles.stepperValueNight]}>
                      Aa
                    </Text>
                    <Pressable
                      style={[styles.stepperButton, isNightMode && styles.stepperButtonNight]}
                      onPress={handleIncreaseLineHeight}
                    >
                      <Ionicons name="add" size={16} color={isNightMode ? "#F0E0BE" : palette.goldDeep} />
                    </Pressable>
                  </View>
                </View>
              </View>

            </ScrollView>
          </AtelierCard>
        </View>
      </Modal>

      <Modal
        visible={chaptersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChaptersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChaptersVisible(false)} />
          <AtelierCard
            style={[styles.chapterSheet, isNightMode && styles.chapterSheetNight]}
            tone={isNightMode ? "dark" : "alt"}
          >
            <View style={[styles.sheetHandle, isNightMode && styles.sheetHandleNight]} />
            <View style={styles.chapterHeader}>
              <Text style={[styles.chapterTitle, isNightMode && styles.chapterTitleNight]}>Capitulos</Text>
              <Pressable onPress={() => setChaptersVisible(false)} style={styles.chapterClose}>
                <Ionicons name="close" size={18} color={isNightMode ? "#E6D8BB" : palette.goldDeep} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.chapterList} showsVerticalScrollIndicator={false}>
              {chapters.map((item, index) => {
                const isCurrent =
                  pageIndex >= item.pageIndex && (chapters[index + 1]?.pageIndex ?? Infinity) > pageIndex;

                return (
                  <View key={item.id}>
                    <Pressable
                      style={[styles.chapterItem, isCurrent && styles.chapterItemActive]}
                      onPress={() => handleJumpToChapter(item.pageIndex)}
                    >
                      <View style={styles.chapterCopy}>
                        <Text
                          style={[
                            styles.chapterItemTitle,
                            isNightMode && styles.chapterItemTitleNight,
                            isCurrent && styles.chapterItemTitleActive,
                          ]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.chapterItemMeta, isNightMode && styles.chapterItemMetaNight]}>
                          Pagina {item.pageIndex + 1}
                        </Text>
                      </View>
                      {isCurrent ? (
                        <Ionicons
                          name="sparkles"
                          size={16}
                          color={isNightMode ? "#E8D5A1" : palette.goldDeep}
                        />
                      ) : null}
                    </Pressable>
                    {index < chapters.length - 1 ? <View style={styles.chapterSeparator} /> : null}
                  </View>
                );
              })}
            </ScrollView>
          </AtelierCard>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  readerLayout: {
    flex: 1,
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: palette.textSoft,
    fontSize: 18,
    fontFamily: typography.bodyRegularFamily,
  },
  loadingTextNight: {
    color: "#D7CDBA",
  },
  errorTitle: {
    color: palette.text,
    fontSize: 24,
    fontFamily: typography.displayAltFamily,
    fontWeight: "700",
  },
  errorTitleNight: {
    color: "#F0E5D0",
  },
  errorText: {
    color: palette.textSoft,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontFamily: typography.bodyRegularFamily,
  },
  errorTextNight: {
    color: "#D1C4AE",
  },
  backButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  backButtonNight: {
    borderColor: "rgba(200,156,78,0.5)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  backButtonText: {
    color: palette.goldDeep,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  backButtonTextNight: {
    color: "#E4D3AE",
  },
  chromeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  chromeRowTablet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 860,
  },
  chromeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chromeLabel: {
    color: palette.goldDeep,
    fontWeight: "700",
    fontFamily: typography.labelFamily,
  },
  chromeLabelNight: {
    color: "#E4D4AF",
  },
  chromeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  preferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F6ECDC",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.lineStrong,
  },
  preferenceChipNight: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(200,156,78,0.44)",
  },
  preferenceLabel: {
    color: palette.textSoft,
    fontWeight: "600",
    fontFamily: typography.labelFamily,
  },
  preferenceLabelNight: {
    color: "#F0E5CF",
  },
  readerSurface: {
    flex: 1,
    backgroundColor: "#FFF8EA",
  },
  readerSurfaceTablet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 860,
  },
  readerSurfaceNight: {
    backgroundColor: "#111E19",
  },
  pageSurface: {
    flex: 1,
    minHeight: 420,
    gap: spacing.sm,
    justifyContent: "flex-start",
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  pageSurfaceNight: {
    backgroundColor: "#111E19",
  },
  paragraph: {
    color: "#31271C",
  },
  paragraphNight: {
    color: "#F5EEE0",
  },
  emptyPage: {
    color: palette.textSoft,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    fontFamily: typography.bodyRegularFamily,
  },
  emptyPageNight: {
    color: "#D6CAB5",
  },
  footerShell: {
    width: "100%",
  },
  footerCard: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  footerCardTablet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 860,
    paddingHorizontal: spacing.md,
  },
  footerCardNight: {
    backgroundColor: "#111E19",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  navButton: {
    minWidth: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: "#F7ECDC",
  },
  navButtonNight: {
    borderColor: "rgba(200,156,78,0.42)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  navButtonDisabled: {
    borderColor: palette.line,
    backgroundColor: "#F3E8D8",
  },
  navButtonDisabledNight: {
    borderColor: "rgba(130,117,94,0.32)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  navLabel: {
    color: palette.goldDeep,
    fontFamily: typography.labelFamily,
    fontWeight: "700",
  },
  navLabelNight: {
    color: "#F2E5C8",
  },
  navLabelDisabled: {
    color: palette.textMuted,
  },
  navLabelDisabledNight: {
    color: "#6F6A5F",
  },
  progressWrap: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    minWidth: 0,
  },
  progressLabel: {
    color: palette.text,
    fontFamily: typography.displayAltFamily,
    fontSize: 20,
    fontWeight: "700",
  },
  progressLabelNight: {
    color: "#F4E9D1",
  },
  progressSubtle: {
    color: palette.textMuted,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 14,
  },
  progressSubtleNight: {
    color: "#AA9D88",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(6, 10, 9, 0.42)",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  chapterSheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingTop: spacing.sm,
  },
  chapterSheetNight: {
    backgroundColor: "#112019",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(138,103,41,0.28)",
    marginBottom: spacing.sm,
  },
  sheetHandleNight: {
    backgroundColor: "rgba(228,212,175,0.24)",
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  chapterTitle: {
    color: palette.text,
    fontFamily: typography.displayAltFamily,
    fontSize: 24,
    fontWeight: "700",
  },
  chapterTitleNight: {
    color: "#F2E7D1",
  },
  chapterClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterList: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  settingGroup: {
    gap: spacing.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.lineStrong,
    backgroundColor: "#F7ECDC",
  },
  stepperButtonNight: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(200,156,78,0.42)",
  },
  stepperValue: {
    minWidth: 24,
    textAlign: "center",
    color: palette.text,
    fontFamily: typography.displayAltFamily,
    fontSize: 20,
    fontWeight: "700",
  },
  stepperValueNight: {
    color: "#F2E7D1",
  },
  groupTitle: {
    color: palette.goldDeep,
    fontFamily: typography.labelFamily,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  groupTitleNight: {
    color: "#DDBB73",
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  chapterItemActive: {
    backgroundColor: "rgba(200,156,78,0.08)",
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
  },
  chapterCopy: {
    flex: 1,
    gap: 2,
  },
  chapterItemTitle: {
    color: palette.text,
    fontFamily: typography.bodySemiBoldFamily,
    fontSize: 17,
    lineHeight: 22,
  },
  chapterItemTitleNight: {
    color: "#EEE2CC",
  },
  chapterItemTitleActive: {
    color: palette.goldDeep,
  },
  chapterItemMeta: {
    color: palette.textMuted,
    fontFamily: typography.bodyRegularFamily,
    fontSize: 14,
  },
  chapterItemMetaNight: {
    color: "#A99E8C",
  },
  chapterSeparator: {
    height: 1,
    backgroundColor: "rgba(167,131,66,0.18)",
  },
});
