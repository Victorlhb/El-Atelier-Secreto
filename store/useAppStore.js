import { create } from "zustand";
import { mockBooks } from "../constants/mockData";

export const useAppStore = create((set, get) => ({
  favoriteIds: mockBooks.filter((book) => book.favorite).map((book) => book.id),
  downloadedIds: mockBooks.filter((book) => book.downloaded).map((book) => book.id),
  activeGenres: [],
  searchQuery: "",
  downloads: {},
  localLibrary: {
    status: "idle",
    scanned: 0,
    imported: 0,
    message: "",
    lastIndexedAt: null,
    lastSourceLabel: "",
  },
  readerPreferences: {
    theme: "pergamino",
    fontScale: 1,
    lineHeight: 1.8,
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleGenre: (genre) =>
    set((state) => {
      const activeGenres = state.activeGenres.includes(genre)
        ? state.activeGenres.filter((item) => item !== genre)
        : [...state.activeGenres, genre];

      return { activeGenres };
    }),
  toggleFavorite: (bookId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.includes(bookId)
        ? state.favoriteIds.filter((item) => item !== bookId)
        : [...state.favoriteIds, bookId],
    })),
  setDownloadProgress: (bookId, progress) =>
    set((state) => ({
      downloads: {
        ...state.downloads,
        [bookId]: {
          ...(state.downloads[bookId] || {}),
          progress,
          status: progress >= 1 ? "completed" : "downloading",
        },
      },
    })),
  markDownloaded: (bookId) =>
    set((state) => ({
      downloadedIds: state.downloadedIds.includes(bookId)
        ? state.downloadedIds
        : [...state.downloadedIds, bookId],
      downloads: {
        ...state.downloads,
        [bookId]: {
          progress: 1,
          status: "completed",
        },
      },
    })),
  setLocalLibraryState: (patch) =>
    set((state) => ({
      localLibrary: {
        ...state.localLibrary,
        ...patch,
      },
    })),
  updateReaderPreferences: (patch) =>
    set((state) => ({
      readerPreferences: {
        ...state.readerPreferences,
        ...patch,
      },
    })),
  resetSearch: () => set({ searchQuery: "", activeGenres: [] }),
  getBookState: (bookId) => {
    const state = get();
    return {
      isFavorite: state.favoriteIds.includes(bookId),
      isDownloaded: state.downloadedIds.includes(bookId),
      download: state.downloads[bookId] || null,
    };
  },
}));
