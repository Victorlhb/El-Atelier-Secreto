import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "../constants/config";
import { fetchGoogleBooksMetadata } from "../lib/googleBooks";
import {
  getLocalBookById,
  getLibraryShelfBooks,
  searchLocalBooks,
  updateLocalBookMetadata,
} from "../lib/localLibrary";
import { useAppStore } from "../store/useAppStore";

const metadataRequestsInFlight = new Set();
const metadataAttempts = new Map();
const METADATA_RETRY_WINDOW_MS = 10 * 60 * 1000;

function normalizeBook(book) {
  return {
    ...book,
    description: book.description || "Sinopsis pendiente para este tomo.",
    genre: Array.isArray(book.genre) ? book.genre : [],
    language: book.language || "es",
    tone: book.tone || "",
    collection: book.collection || "",
    progress: typeof book.progress === "number" ? book.progress : 0,
    readers: typeof book.readers === "number" ? book.readers : 0,
    rating: typeof book.rating === "number" ? book.rating : 0,
    pages: typeof book.pages === "number" ? book.pages : 0,
    source: book.source || "local",
  };
}

function hasSpecificDescription(description) {
  const value = String(description || "").trim();

  return (
    Boolean(value) &&
    value !== "Sinopsis pendiente para este tomo." &&
    value !== "Disponible en tu dispositivo para lectura local."
  );
}

function needsMetadata(book) {
  if (!book || book.source !== "local") {
    return false;
  }

  return !book.cover_url || !hasSpecificDescription(book.description);
}

async function searchBooksPage(params, page) {
  return searchLocalBooks({
    query: params.query,
    genres: params.genre,
    page,
    limit: PAGE_SIZE,
  });
}

function useDebouncedValue(value, delay = 220) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => globalThis.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function useBookSearch(overrides = {}) {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeGenres = useAppStore((state) => state.activeGenres);
  const enabled = overrides.enabled ?? true;
  const resolvedQuery = overrides.query ?? searchQuery;
  const debouncedQuery = useDebouncedValue(resolvedQuery);

  const params = useMemo(
    () => ({
      query: debouncedQuery,
      genre: overrides.genre ?? activeGenres,
      language: overrides.language ?? "",
    }),
    [activeGenres, debouncedQuery, overrides.genre, overrides.language]
  );

  return useInfiniteQuery({
    queryKey: ["books", params],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => searchBooksPage(params, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useBookDetail(id) {
  return useQuery({
    queryKey: ["book", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const localBook = await getLocalBookById(id);
      if (!localBook) {
        throw new Error("Libro no encontrado.");
      }

      return normalizeBook(localBook);
    },
  });
}

export function useDiscoverShelves() {
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  return useQuery({
    queryKey: ["discover-shelves", favoriteIds],
    queryFn: async () => {
      const localShelves = await getLibraryShelfBooks({ favoriteIds, limit: 8 });
      const continueReading =
        localShelves.recent.find((book) => book.progress > 0) || localShelves.recent[0] || null;

      return {
        continueReading,
        favorites: localShelves.favorites,
      };
    },
  });
}

export function useLibraryShelves() {
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  return useQuery({
    queryKey: ["library-shelves", favoriteIds],
    queryFn: async () => {
      const localShelves = await getLibraryShelfBooks({ favoriteIds, limit: 24 });
      const recent = localShelves.recent;
      const favorites = localShelves.favorites;
      const inProgress = recent.filter((book) => book.progress > 0);

      return {
        inProgress,
        favorites,
        recent,
      };
    },
  });
}

export function useVisibleBookMetadata(books = []) {
  const queryClient = useQueryClient();

  const candidates = useMemo(() => {
    const visibleBooks = new Map();

    for (const book of books) {
      if (book?.id && needsMetadata(book)) {
        visibleBooks.set(book.id, book);
      }
    }

    return Array.from(visibleBooks.values()).slice(0, 8);
  }, [books]);

  const candidateKey = useMemo(
    () =>
      candidates
        .map((book) => `${book.id}:${book.cover_url ? 1 : 0}:${hasSpecificDescription(book.description) ? 1 : 0}`)
        .join("|"),
    [candidates]
  );

  useEffect(() => {
    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;

    async function hydrateVisibleBooks() {
      let didUpdate = false;

      for (const book of candidates) {
        const lastAttemptAt = metadataAttempts.get(book.id) || 0;

        if (
          metadataRequestsInFlight.has(book.id) ||
          Date.now() - lastAttemptAt < METADATA_RETRY_WINDOW_MS
        ) {
          continue;
        }

        metadataAttempts.set(book.id, Date.now());
        metadataRequestsInFlight.add(book.id);

        try {
          const metadata = await fetchGoogleBooksMetadata({
            title: book.title,
            author: book.author,
          });

          if (cancelled || !metadata) {
            continue;
          }

          if (metadata.coverUrl || metadata.description || metadata.pageCount > 0) {
            const updated = await updateLocalBookMetadata({
              bookId: book.id,
              coverUrl: metadata.coverUrl,
              description: metadata.description,
              pages: metadata.pageCount,
            });

            didUpdate = didUpdate || updated;
          }
        } catch {
          // Metadata enrichment is optional; the local library remains usable without it.
        } finally {
          metadataRequestsInFlight.delete(book.id);
        }
      }

      if (!cancelled && didUpdate) {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["book"] });
        queryClient.invalidateQueries({ queryKey: ["discover-shelves"] });
        queryClient.invalidateQueries({ queryKey: ["library-shelves"] });
      }
    }

    hydrateVisibleBooks();

    return () => {
      cancelled = true;
    };
  }, [candidateKey, candidates, queryClient]);
}
