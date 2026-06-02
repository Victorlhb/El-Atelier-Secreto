function createUnsupportedError() {
  return new Error("La biblioteca local indexada solo esta disponible en iOS y Android.");
}

export async function initializeLocalLibrary() {
  return;
}

export async function importLocalLibraryFromDevice() {
  throw createUnsupportedError();
}

export async function getLocalLibraryStats() {
  return {
    totalBooks: 0,
    totalBytes: 0,
    lastIndexedAt: null,
    totalSources: 0,
    recentBooks: [],
  };
}

export async function getLocalBookById() {
  return null;
}

export async function searchLocalBooks() {
  return {
    items: [],
    nextPage: undefined,
    total: 0,
  };
}

export async function getLibraryShelfBooks() {
  return {
    recent: [],
    favorites: [],
  };
}
