import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PAGE_SIZE } from "../constants/config";
import { mockBooks } from "../constants/mockData";
import { getLocalBookById, getLibraryShelfBooks, searchLocalBooks } from "../lib/localLibrary";
import { useAppStore } from "../store/useAppStore";

function normalizeBook(book) {
  return {
    ...book,
    description: book.description || "Sinopsis pendiente.",
    genre: Array.isArray(book.genre) ? book.genre : [],
    language: book.language || "es",
    tone: book.tone || (book.source === "local" ? "En dispositivo" : "Tomo"),
    collection: book.collection || (book.source === "local" ? "Biblioteca local" : "Biblioteca"),
    progress: typeof book.progress === "number" ? book.progress : 0,
    readers: typeof book.readers === "number" ? book.readers : 0,
    rating: typeof book.rating === "number" ? book.rating : 0,
    pages: typeof book.pages === "number" ? book.pages : 0,
    source: book.source || "local",
  };
}

async function searchBooksPage(params, page) {
  return searchLocalBooks({
    query: params.query,
    genres: params.genre,
    page,
    limit: PAGE_SIZE,
  });
}

export function useBookSearch(overrides = {}) {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeGenres = useAppStore((state) => state.activeGenres);
  const enabled = overrides.enabled ?? true;

  const params = useMemo(
    () => ({
      query: overrides.query ?? searchQuery,
      genre: overrides.genre ?? activeGenres,
      language: overrides.language ?? "",
    }),
    [activeGenres, overrides.genre, overrides.language, overrides.query, searchQuery]
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
      if (typeof id === "string" && id.startsWith("local:")) {
        const localBook = await getLocalBookById(id);
        if (!localBook) {
          throw new Error("Libro local no encontrado.");
        }
        return normalizeBook(localBook);
      }

      const book = mockBooks.find((item) => item.id === id);
      if (!book) {
        throw new Error("Libro no encontrado.");
      }
      return normalizeBook({ ...book, source: "local" });
    },
  });
}

export function useDiscoverShelves() {
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  return useQuery({
    queryKey: ["discover-shelves", favoriteIds],
    queryFn: async () => {
      const localShelves = await getLibraryShelfBooks({ favoriteIds, limit: 8 });
      const continueReading = localShelves.recent[0] || normalizeBook({ ...mockBooks[0], source: "local" });
      const favorites =
        localShelves.favorites.length > 0
          ? localShelves.favorites
          : mockBooks.filter((book) => book.favorite).map((book) => normalizeBook({ ...book, source: "local" }));

      return {
        continueReading,
        favorites,
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
      const fallbackBooks = mockBooks.map((book) => normalizeBook({ ...book, source: "local" }));
      const recent = localShelves.recent.length > 0 ? localShelves.recent : fallbackBooks.slice(0, 12);
      const favorites =
        localShelves.favorites.length > 0
          ? localShelves.favorites
          : fallbackBooks.filter((book) => book.favorite).slice(0, 8);
      const inProgress = recent.filter((book) => book.progress > 0);

      return {
        inProgress,
        favorites,
        recent,
      };
    },
  });
}
