import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

const SUPPORTED_EXTENSIONS = new Set(["epub", "mobi", "pdf"]);
const IMPORT_BATCH_SIZE = 200;
const RESULT_PAGE_SIZE = 20;
const BROAD_GENRE_RULES = [
  {
    genre: "Manga y comic",
    keywords: [
      "manga",
      "comic",
      "comics",
      "novela grafica",
      "graphic novel",
      "manhwa",
      "manhua",
      "webtoon",
      "shonen",
      "shojo",
      "seinen",
      "josei",
      "kamome shirahama",
      "hayao miyazaki",
    ],
  },
  {
    genre: "Fantasia",
    keywords: [
      "fantasia",
      "wizard",
      "witch",
      "bruja",
      "mago",
      "magia",
      "dragon",
      "grimorio",
      "hechizo",
      "hadas",
      "fae",
      "reino",
      "hobbit",
      "earthsea",
      "stormlight",
      "sanderson",
      "rothfuss",
      "tolkien",
      "ursula k le guin",
    ],
  },
  {
    genre: "Ciencia ficcion",
    keywords: [
      "ciencia ficcion",
      "science fiction",
      "sci fi",
      "scifi",
      "cyberpunk",
      "distopia",
      "dystopia",
      "robot",
      "robots",
      "android",
      "espacial",
      "space",
      "galaxia",
      "galactic",
      "futuro",
      "future",
      "fundacion",
      "foundation",
      "dune",
      "marte",
      "martian",
    ],
  },
  {
    genre: "Misterio",
    keywords: [
      "misterio",
      "thriller",
      "detective",
      "detectives",
      "crimen",
      "crime",
      "asesinato",
      "asesino",
      "noir",
      "enigma",
      "caso",
      "policiaca",
      "investigacion",
      "secreto",
      "secretos",
    ],
  },
  {
    genre: "Terror",
    keywords: [
      "terror",
      "horror",
      "vampiro",
      "vampiros",
      "fantasma",
      "fantasmas",
      "demonio",
      "demonios",
      "sangre",
      "maldicion",
      "muertos",
      "cadaver",
      "lovecraft",
      "stephen king",
    ],
  },
  {
    genre: "Romance",
    keywords: [
      "romance",
      "amor",
      "amor y",
      "corazon",
      "corazones",
      "beso",
      "besos",
      "boda",
      "novia",
      "novio",
      "duque",
      "duquesa",
      "regencia",
      "highlander",
      "enemies to lovers",
    ],
  },
  {
    genre: "Historia",
    keywords: [
      "historia",
      "historica",
      "historico",
      "guerra",
      "imperio",
      "roma",
      "romano",
      "medieval",
      "vikingo",
      "tudor",
      "napoleon",
      "revolucion",
      "segunda guerra",
      "world war",
      "civilizacion",
    ],
  },
];

let databasePromise;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("atelier-local-library.db");
  }

  return databasePromise;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function cleanLabel(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bno oficial\b/gi, "")
    .trim();
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getExtensionFromName(name) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }

  return name.slice(dotIndex + 1).toLowerCase();
}

function getFormatFromName(name) {
  return getExtensionFromName(name).toUpperCase();
}

function classifyBroadGenres({ title, author, filePath }) {
  const haystack = normalizeText([title, author, filePath].filter(Boolean).join(" "));
  const matches = [];

  for (const rule of BROAD_GENRE_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      matches.push(rule.genre);
    }

    if (matches.length >= 2) {
      break;
    }
  }

  return matches.length > 0 ? matches : ["Narrativa"];
}

function buildFtsQuery(rawQuery) {
  const tokens = normalizeText(rawQuery)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((token) => `${token.replace(/"/g, '""')}*`);

  return tokens.join(" AND ");
}

function encodeBookId(rowId) {
  return `local:${rowId}`;
}

function decodeBookId(bookId) {
  if (typeof bookId !== "string" || !bookId.startsWith("local:")) {
    return null;
  }

  const numericId = Number(bookId.slice("local:".length));
  return Number.isFinite(numericId) ? numericId : null;
}

function parseAndroidDocumentPath(uri) {
  const marker = "/document/";
  const index = uri.indexOf(marker);

  if (index === -1) {
    return decodeURIComponent(uri);
  }

  return decodeURIComponent(uri.slice(index + marker.length));
}

function deriveAndroidRelativePath(sourceUri, childUri) {
  const rootPath = parseAndroidDocumentPath(sourceUri).split(":").at(-1) || "";
  const childPath = parseAndroidDocumentPath(childUri).split(":").at(-1) || "";

  if (!rootPath) {
    return childPath;
  }

  return childPath.startsWith(`${rootPath}/`) ? childPath.slice(rootPath.length + 1) : childPath;
}

function deriveBookFields(relativePath) {
  const segments = relativePath.split("/").filter(Boolean);
  const fileName = segments.at(-1) || relativePath;
  const title = cleanLabel(fileName.replace(/\.[^.]+$/, ""));
  const authorFolder = segments.length > 1 ? segments.at(-2) : "Autor desconocido";
  const author = cleanLabel(authorFolder || "Autor desconocido");

  return {
    title,
    author,
    fileName,
  };
}

function mapLocalRowToBook(row) {
  return {
    id: encodeBookId(row.id),
    title: row.title,
    author: row.author,
    description: row.description?.trim() || "Sinopsis pendiente para este tomo.",
    genre: row.genre ? row.genre.split("|").filter(Boolean) : [],
    language: row.language || "es",
    pages: row.pages || 0,
    format: row.format,
    rating: 0,
    readers: 0,
    progress: row.progress || 0,
    downloaded: true,
    favorite: false,
    tone: "En dispositivo",
    collection: "Biblioteca local",
    cover_url: row.cover_url || null,
    coverPalette: ["#D9D0C2", "#6F8273", "#C4A04D"],
    source: "local",
    localUri: row.file_uri,
    localPath: row.file_path,
    sourceLabel: row.source_label,
  };
}

async function upsertLocalBookBatch(records) {
  if (records.length === 0) {
    return;
  }

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const record of records) {
      await db.runAsync(
        `INSERT INTO local_books (
          source_id,
          source_label,
          file_uri,
          file_path,
          file_name,
          title,
          author,
          normalized_title,
          normalized_author,
          genre,
          format,
          language,
          description,
          size,
          modified_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
        ON CONFLICT(file_uri) DO UPDATE SET
          source_id = excluded.source_id,
          source_label = excluded.source_label,
          file_path = excluded.file_path,
          file_name = excluded.file_name,
          title = excluded.title,
          author = excluded.author,
          normalized_title = excluded.normalized_title,
          normalized_author = excluded.normalized_author,
          genre = excluded.genre,
          format = excluded.format,
          language = excluded.language,
          description = COALESCE(NULLIF(excluded.description, ''), local_books.description),
          size = excluded.size,
          modified_at = excluded.modified_at,
          updated_at = strftime('%s','now')`,
        record.sourceId,
        record.sourceLabel,
        record.fileUri,
        record.filePath,
        record.fileName,
        record.title,
        record.author,
        normalizeText(record.title),
        normalizeText(record.author),
        record.genre,
        record.format,
        record.language,
        record.description,
        record.size,
        record.modifiedAt
      );
    }
  });

  await db.execAsync(`INSERT INTO local_books_fts(local_books_fts) VALUES ('rebuild');`);
}

async function saveLibrarySource(source) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO library_sources (id, uri, label, type, platform, indexed_at, file_count)
     VALUES (?, ?, ?, ?, ?, strftime('%s','now'), ?)
     ON CONFLICT(id) DO UPDATE SET
       uri = excluded.uri,
       label = excluded.label,
       type = excluded.type,
       platform = excluded.platform,
       indexed_at = strftime('%s','now'),
       file_count = excluded.file_count`,
    source.id,
    source.uri,
    source.label,
    source.type,
    source.platform,
    source.fileCount
  );
}

async function getInfoSafe(uri) {
  try {
    return await FileSystem.getInfoAsync(uri);
  } catch {
    return null;
  }
}

async function isDirectoryUri(uri) {
  const info = await getInfoSafe(uri);
  if (info && typeof info.isDirectory === "boolean") {
    return info.isDirectory;
  }

  try {
    await FileSystem.StorageAccessFramework.readDirectoryAsync(uri);
    return true;
  } catch {
    return false;
  }
}

function buildAndroidRecord(source, fileUri, info) {
  const relativePath = deriveAndroidRelativePath(source.uri, fileUri);
  const { title, author, fileName } = deriveBookFields(relativePath);
  const genres = classifyBroadGenres({ title, author, filePath: relativePath });

  return {
    sourceId: source.id,
    sourceLabel: source.label,
    fileUri,
    filePath: relativePath,
    fileName,
    title,
    author,
    genre: genres.join("|"),
    format: getFormatFromName(fileName),
    language: "es",
    description: null,
    size: info?.size || 0,
    modifiedAt: info?.modificationTime ? Math.floor(info.modificationTime / 1000) : null,
  };
}

function buildDocumentPickerRecord(source, asset) {
  const assetName = asset.name || asset.uri.split("/").at(-1) || "Libro";
  const { title, author, fileName } = deriveBookFields(assetName);
  const genres = classifyBroadGenres({ title, author, filePath: assetName });

  return {
    sourceId: source.id,
    sourceLabel: source.label,
    fileUri: asset.uri,
    filePath: assetName,
    fileName,
    title,
    author,
    genre: genres.join("|"),
    format: getFormatFromName(assetName),
    language: "es",
    description: null,
    size: asset.size || 0,
    modifiedAt: asset.lastModified ? Math.floor(asset.lastModified / 1000) : null,
  };
}

async function flushBatch(batch, counters, onProgress) {
  if (batch.length === 0) {
    return;
  }

  const records = batch.splice(0, batch.length);
  await upsertLocalBookBatch(records);
  counters.imported += records.length;

  if (onProgress) {
    onProgress({
      status: "indexing",
      scanned: counters.scanned,
      imported: counters.imported,
      message: `Ordenando ${counters.imported} tomos en tu biblioteca...`,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 0));
}

export async function initializeLocalLibrary() {
  if (Platform.OS === "web") {
    return;
  }

  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS library_sources (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      platform TEXT NOT NULL,
      indexed_at INTEGER,
      file_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      source_label TEXT NOT NULL,
      file_uri TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      normalized_title TEXT NOT NULL,
      normalized_author TEXT NOT NULL,
      genre TEXT DEFAULT '',
      format TEXT NOT NULL,
      language TEXT DEFAULT 'es',
      description TEXT,
      cover_url TEXT,
      pages INTEGER DEFAULT 0,
      progress REAL DEFAULT 0,
      size INTEGER DEFAULT 0,
      modified_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (source_id) REFERENCES library_sources (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_local_books_title ON local_books (normalized_title);
    CREATE INDEX IF NOT EXISTS idx_local_books_author ON local_books (normalized_author);
    CREATE INDEX IF NOT EXISTS idx_local_books_source ON local_books (source_id);

    CREATE TABLE IF NOT EXISTS reader_state (
      book_id TEXT PRIMARY KEY NOT NULL,
      page_index INTEGER DEFAULT 0,
      page_count INTEGER DEFAULT 0,
      progress REAL DEFAULT 0,
      location TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS local_books_fts USING fts5(
      title,
      author,
      genre,
      content='local_books',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 2'
    );
  `);

  await db.execAsync(`INSERT INTO local_books_fts(local_books_fts) VALUES ('rebuild');`);
}

export async function importLocalLibraryFromDevice({ onProgress } = {}) {
  await initializeLocalLibrary();

  if (Platform.OS === "android") {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted || !permission.directoryUri) {
      return { canceled: true };
    }

    const source = {
      id: `android-${hashString(permission.directoryUri)}`,
      uri: permission.directoryUri,
      label: cleanLabel(parseAndroidDocumentPath(permission.directoryUri).split("/").at(-1) || "Biblioteca local"),
      type: "directory",
      platform: Platform.OS,
    };

    const queue = [permission.directoryUri];
    const counters = { scanned: 0, imported: 0 };
    const batch = [];

    if (onProgress) {
      onProgress({
        status: "scanning",
        scanned: 0,
        imported: 0,
        message: "Explorando la carpeta del dispositivo...",
      });
    }

    while (queue.length > 0) {
      const currentUri = queue.shift();
      const children = await FileSystem.StorageAccessFramework.readDirectoryAsync(currentUri);

      for (const childUri of children) {
        if (await isDirectoryUri(childUri)) {
          queue.push(childUri);
          continue;
        }

        const relativePath = deriveAndroidRelativePath(source.uri, childUri);
        const extension = getExtensionFromName(relativePath);

        if (!SUPPORTED_EXTENSIONS.has(extension)) {
          continue;
        }

        const info = await getInfoSafe(childUri);
        batch.push(buildAndroidRecord(source, childUri, info));
        counters.scanned += 1;

        if (batch.length >= IMPORT_BATCH_SIZE) {
          await flushBatch(batch, counters, onProgress);
        }
      }
    }

    await flushBatch(batch, counters, onProgress);
    await saveLibrarySource({ ...source, fileCount: counters.imported });

    return {
      canceled: false,
      sourceLabel: source.label,
      scanned: counters.scanned,
      imported: counters.imported,
    };
  }

  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: false,
    type: ["application/epub+zip", "application/pdf", "*/*"],
  });

  if (result.canceled || !result.assets?.length) {
    return { canceled: true };
  }

  const source = {
    id: `picker-${Date.now()}`,
    uri: `picker://${Date.now()}`,
    label: "Archivos importados",
    type: "picker",
    platform: Platform.OS,
  };

  const counters = { scanned: 0, imported: 0 };
  const batch = [];

  for (const asset of result.assets) {
    const extension = getExtensionFromName(asset.name || asset.uri);

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      continue;
    }

    batch.push(buildDocumentPickerRecord(source, asset));
    counters.scanned += 1;

    if (batch.length >= IMPORT_BATCH_SIZE) {
      await flushBatch(batch, counters, onProgress);
    }
  }

  await flushBatch(batch, counters, onProgress);
  await saveLibrarySource({ ...source, fileCount: counters.imported });

  return {
    canceled: false,
    sourceLabel: source.label,
    scanned: counters.scanned,
    imported: counters.imported,
  };
}

export async function getLocalLibraryStats() {
  await initializeLocalLibrary();

  const db = await getDatabase();
  const totals = await db.getFirstAsync(
    `SELECT COUNT(*) AS totalBooks, COALESCE(SUM(size), 0) AS totalBytes, MAX(updated_at) AS lastIndexedAt
     FROM local_books`
  );
  const sources = await db.getFirstAsync(`SELECT COUNT(*) AS totalSources FROM library_sources`);
  const recentRows = await db.getAllAsync(
    `SELECT * FROM local_books ORDER BY updated_at DESC, id DESC LIMIT ?`,
    6
  );

  return {
    totalBooks: totals?.totalBooks || 0,
    totalBytes: totals?.totalBytes || 0,
    lastIndexedAt: totals?.lastIndexedAt || null,
    totalSources: sources?.totalSources || 0,
    recentBooks: recentRows.map(mapLocalRowToBook),
  };
}

export async function getLocalBookById(bookId) {
  await initializeLocalLibrary();

  const rowId = decodeBookId(bookId);
  if (!rowId) {
    return null;
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync(`SELECT * FROM local_books WHERE id = ? LIMIT 1`, rowId);

  return row ? mapLocalRowToBook(row) : null;
}

export async function searchLocalBooks({
  query = "",
  genres = [],
  page = 1,
  limit = RESULT_PAGE_SIZE,
} = {}) {
  await initializeLocalLibrary();

  const db = await getDatabase();
  const offset = (page - 1) * limit;
  const hasQuery = Boolean(query.trim());
  const hasGenres = genres.length > 0;
  const runQuery = async ({ fromClause, whereClauses, params, orderClause }) => {
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const items = await db.getAllAsync(
      `SELECT lb.* ${fromClause} ${whereSql} ${orderClause} LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
    const totalRow = await db.getFirstAsync(`SELECT COUNT(*) AS total ${fromClause} ${whereSql}`, ...params);
    const total = totalRow?.total || 0;

    return {
      items: items.map(mapLocalRowToBook),
      nextPage: offset + items.length < total ? page + 1 : undefined,
      total,
    };
  };

  const genreClause = hasGenres ? `(${genres.map(() => "lb.genre LIKE ?").join(" OR ")})` : "";
  const genreParams = hasGenres ? genres.map((genre) => `%${genre}%`) : [];

  if (hasQuery) {
    const ftsQuery = buildFtsQuery(query);

    if (!ftsQuery) {
      return {
        items: [],
        nextPage: undefined,
        total: 0,
      };
    }

    try {
      const ftsSearch = await runQuery({
        fromClause: `
          FROM local_books lb
          JOIN local_books_fts ON local_books_fts.rowid = lb.id
        `,
        whereClauses: [genreClause, "local_books_fts MATCH ?"].filter(Boolean),
        params: [...genreParams, ftsQuery],
        orderClause: "ORDER BY bm25(local_books_fts), lb.normalized_title ASC",
      });

      if (ftsSearch.total > 0) {
        return ftsSearch;
      }
    } catch {
      // Some Android SQLite builds are fussier with MATCH queries; fallback below keeps search usable.
    }

    const normalizedQuery = normalizeText(query);
    const tokens = normalizedQuery.split(/[^a-z0-9]+/i).filter(Boolean);
    const likeClauses = [];
    const likeParams = [...genreParams];

    if (normalizedQuery) {
      likeClauses.push(
        "(lb.normalized_title LIKE ? OR lb.normalized_author LIKE ? OR lower(COALESCE(lb.description, '')) LIKE ? OR lower(lb.file_name) LIKE ?)"
      );
      likeParams.push(
        `%${normalizedQuery}%`,
        `%${normalizedQuery}%`,
        `%${normalizedQuery}%`,
        `%${normalizedQuery}%`
      );
    }

    if (tokens.length > 0) {
      likeClauses.push(
        `(${tokens
          .map(
            () =>
              "(lb.normalized_title LIKE ? OR lb.normalized_author LIKE ? OR lower(COALESCE(lb.description, '')) LIKE ? OR lower(lb.file_name) LIKE ?)"
          )
          .join(" OR ")})`
      );

      for (const token of tokens) {
        likeParams.push(`%${token}%`, `%${token}%`, `%${token}%`, `%${token}%`);
      }
    }

    return runQuery({
      fromClause: "FROM local_books lb",
      whereClauses: [genreClause, ...likeClauses].filter(Boolean),
      params: likeParams,
      orderClause: "ORDER BY lb.normalized_title ASC",
    });
  }

  return runQuery({
    fromClause: "FROM local_books lb",
    whereClauses: genreClause ? [genreClause] : [],
    params: genreParams,
    orderClause: "ORDER BY lb.normalized_title ASC",
  });
}

export async function getLibraryShelfBooks({ favoriteIds = [], limit = 12 } = {}) {
  await initializeLocalLibrary();

  const db = await getDatabase();
  const recentRows = await db.getAllAsync(
    `SELECT * FROM local_books ORDER BY updated_at DESC, id DESC LIMIT ?`,
    limit
  );

  const favoriteRowIds = favoriteIds
    .map(decodeBookId)
    .filter((rowId) => typeof rowId === "number");

  let favoriteRows = [];
  if (favoriteRowIds.length > 0) {
    const placeholders = favoriteRowIds.map(() => "?").join(", ");
    favoriteRows = await db.getAllAsync(
      `SELECT * FROM local_books WHERE id IN (${placeholders}) ORDER BY updated_at DESC, id DESC LIMIT ?`,
      ...favoriteRowIds,
      limit
    );
  }

  return {
    recent: recentRows.map(mapLocalRowToBook),
    favorites: favoriteRows.map(mapLocalRowToBook),
  };
}

export async function getReaderState(bookId) {
  await initializeLocalLibrary();

  const db = await getDatabase();
  const row = await db.getFirstAsync(`SELECT * FROM reader_state WHERE book_id = ? LIMIT 1`, bookId);

  return {
    pageIndex: row?.page_index || 0,
    pageCount: row?.page_count || 0,
    progress: row?.progress || 0,
    location: row?.location || "",
    updatedAt: row?.updated_at || null,
  };
}

export async function saveReaderState({ bookId, pageIndex, pageCount, progress, location = "" }) {
  await initializeLocalLibrary();

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO reader_state (book_id, page_index, page_count, progress, location, updated_at)
     VALUES (?, ?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(book_id) DO UPDATE SET
       page_index = excluded.page_index,
       page_count = excluded.page_count,
       progress = excluded.progress,
       location = excluded.location,
       updated_at = strftime('%s','now')`,
    bookId,
    pageIndex,
    pageCount,
    progress,
    location
  );

  const rowId = decodeBookId(bookId);
  if (typeof rowId === "number") {
    await db.runAsync(
      `UPDATE local_books
       SET progress = ?, updated_at = strftime('%s','now')
       WHERE id = ?`,
      progress,
      rowId
    );
  }
}

export async function updateLocalBookMetadata({ bookId, coverUrl, description, pages = 0 }) {
  await initializeLocalLibrary();

  const rowId = decodeBookId(bookId);
  if (typeof rowId !== "number") {
    return false;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_books
     SET cover_url = COALESCE(?, cover_url),
         description = COALESCE(NULLIF(?, ''), description),
         pages = CASE WHEN ? > 0 THEN ? ELSE pages END
     WHERE id = ?`,
    coverUrl || null,
    description || "",
    pages,
    pages,
    rowId
  );

  return true;
}

export async function deleteLocalBook(bookId) {
  await initializeLocalLibrary();

  const rowId = decodeBookId(bookId);
  if (typeof rowId !== "number") {
    throw new Error("No se pudo localizar el tomo para borrarlo.");
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync(`SELECT id, source_id, file_uri FROM local_books WHERE id = ? LIMIT 1`, rowId);

  if (!row) {
    throw new Error("El tomo ya no existe en la biblioteca local.");
  }

  if (row.file_uri) {
    if (Platform.OS === "android" && row.file_uri.startsWith("content://")) {
      await FileSystem.StorageAccessFramework.deleteAsync(row.file_uri, { idempotent: true });
    } else {
      await FileSystem.deleteAsync(row.file_uri, { idempotent: true });
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM reader_state WHERE book_id = ?`, bookId);
    await db.runAsync(`DELETE FROM local_books WHERE id = ?`, rowId);
    await db.runAsync(
      `UPDATE library_sources
       SET file_count = (
         SELECT COUNT(*) FROM local_books WHERE source_id = ?
       ),
       indexed_at = strftime('%s','now')
       WHERE id = ?`,
      row.source_id,
      row.source_id
    );
    await db.runAsync(`DELETE FROM library_sources WHERE id = ? AND file_count <= 0`, row.source_id);
  });

  await db.execAsync(`INSERT INTO local_books_fts(local_books_fts) VALUES ('rebuild');`);

  return true;
}
