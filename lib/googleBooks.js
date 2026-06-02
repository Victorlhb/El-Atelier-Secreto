const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

const googleBooksApiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureHttps(url) {
  if (!url) {
    return null;
  }

  return String(url).replace(/^http:\/\//i, "https://");
}

function buildQuery({ isbn, title, author }) {
  if (isbn) {
    return `isbn:${isbn}`;
  }

  const parts = [];

  if (title) {
    parts.push(`intitle:${title}`);
  }

  if (author) {
    parts.push(`inauthor:${author}`);
  }

  return parts.join("+");
}

function pickBestVolume(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    items.find((item) => item?.volumeInfo?.imageLinks) ||
    items.find((item) => item?.volumeInfo?.description) ||
    items[0]
  );
}

async function requestMetadataForQuery(query) {
  if (!query) {
    return null;
  }

  const url = new URL(GOOGLE_BOOKS_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("fields", "items(volumeInfo/title,volumeInfo/description,volumeInfo/pageCount,volumeInfo/imageLinks)");
  url.searchParams.set("key", googleBooksApiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Books respondio ${response.status}.`);
  }

  const data = await response.json();
  const volumeInfo = pickBestVolume(data.items)?.volumeInfo;

  if (!volumeInfo) {
    return null;
  }

  const imageLinks = volumeInfo.imageLinks;
  const coverUrl =
    ensureHttps(
      imageLinks?.extraLarge ||
        imageLinks?.large ||
        imageLinks?.medium ||
        imageLinks?.small ||
        imageLinks?.thumbnail ||
        imageLinks?.smallThumbnail
    ) ||
    null;

  return {
    title: volumeInfo.title ?? null,
    description: collapseWhitespace(volumeInfo.description),
    coverUrl,
    pageCount: Number.isFinite(volumeInfo.pageCount) ? volumeInfo.pageCount : 0,
  };
}

export async function fetchGoogleBooksMetadata(params) {
  if (!googleBooksApiKey) {
    return null;
  }

  const primaryQuery = buildQuery(params);
  if (!primaryQuery) {
    return null;
  }

  const queries = [
    primaryQuery,
    params?.title ? `intitle:${params.title}` : "",
    params?.author ? `inauthor:${params.author}` : "",
  ].filter(Boolean);

  let bestMetadata = null;

  for (const query of queries) {
    const metadata = await requestMetadataForQuery(query);
    if (!metadata) {
      continue;
    }

    if (metadata.coverUrl) {
      return metadata;
    }

    if (!bestMetadata) {
      bestMetadata = metadata;
    }
  }

  return bestMetadata;
}

export async function fetchGoogleBooksCover(params) {
  const metadata = await fetchGoogleBooksMetadata(params);

  return metadata
    ? {
        title: metadata.title,
        coverUrl: metadata.coverUrl,
      }
    : null;
}
