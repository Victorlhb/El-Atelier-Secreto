import { useState } from "react";
import { downloadBook } from "../lib/download";
import { useAppStore } from "../store/useAppStore";

export function useDownload(book) {
  const [loading, setLoading] = useState(false);
  const downloadState = useAppStore((state) => state.downloads[book.id]);
  const setDownloadProgress = useAppStore((state) => state.setDownloadProgress);
  const markDownloaded = useAppStore((state) => state.markDownloaded);
  const isLocalBook = book.source === "local";

  async function startDownload() {
    if (isLocalBook) {
      markDownloaded(book.id);
      return;
    }

    setLoading(true);
    try {
      await downloadBook(book, (progress) => setDownloadProgress(book.id, progress));
      markDownloaded(book.id);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    progress: isLocalBook ? 1 : downloadState?.progress || 0,
    completed: isLocalBook || downloadState?.status === "completed",
    startDownload,
  };
}
