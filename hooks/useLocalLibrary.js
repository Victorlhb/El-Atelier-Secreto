import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLibraryShelfBooks,
  getLocalLibraryStats,
  importLocalLibraryFromDevice,
  initializeLocalLibrary,
} from "../lib/localLibrary";
import { useAppStore } from "../store/useAppStore";

export function useInitializeLocalLibrary() {
  useEffect(() => {
    initializeLocalLibrary().catch(() => {
      // Ignore initialisation errors here; dedicated queries surface them in context.
    });
  }, []);
}

export function useLocalLibraryStats() {
  return useQuery({
    queryKey: ["local-library", "stats"],
    queryFn: getLocalLibraryStats,
    staleTime: 30_000,
  });
}

export function useLocalLibraryShelves() {
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  return useQuery({
    queryKey: ["local-library", "shelves", favoriteIds],
    queryFn: () => getLibraryShelfBooks({ favoriteIds }),
    staleTime: 30_000,
  });
}

export function useLocalLibraryImport() {
  const queryClient = useQueryClient();
  const setLocalLibraryState = useAppStore((state) => state.setLocalLibraryState);

  return useMutation({
    mutationFn: async () => {
      setLocalLibraryState({
        status: "scanning",
        scanned: 0,
        imported: 0,
        message: "Preparando la biblioteca local...",
      });

      return importLocalLibraryFromDevice({
        onProgress: (progress) => setLocalLibraryState(progress),
      });
    },
    onSuccess: (result) => {
      if (result?.canceled) {
        setLocalLibraryState({
          status: "idle",
          message: "Importacion cancelada.",
        });
        return;
      }

      setLocalLibraryState({
        status: "completed",
        scanned: result?.scanned || 0,
        imported: result?.imported || 0,
        message: `${result?.imported || 0} tomos reunidos en tu dispositivo.`,
        lastIndexedAt: Date.now(),
        lastSourceLabel: result?.sourceLabel || "",
      });

      queryClient.invalidateQueries({ queryKey: ["local-library"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["discover-shelves"] });
      queryClient.invalidateQueries({ queryKey: ["library-shelves"] });
    },
    onError: (error) => {
      setLocalLibraryState({
        status: "error",
        message: error?.message || "No se pudo indexar la biblioteca local.",
      });
    },
  });
}
