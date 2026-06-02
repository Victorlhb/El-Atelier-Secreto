const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

const googleBooksApiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

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

export async function fetchGoogleBooksCover(params) {
  if (!googleBooksApiKey) {
    throw new Error("Falta EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY en el entorno.");
  }

  const query = buildQuery(params);
  if (!query) {
    throw new Error("Necesitas al menos un isbn o un titulo para buscar portada.");
  }

  const url = new URL(GOOGLE_BOOKS_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("fields", "items(volumeInfo/title,volumeInfo/imageLinks)");
  url.searchParams.set("key", googleBooksApiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Books respondio ${response.status}.`);
  }

  const data = await response.json();
  const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;

  const coverUrl =
    imageLinks?.extraLarge ||
    imageLinks?.large ||
    imageLinks?.medium ||
    imageLinks?.small ||
    imageLinks?.thumbnail ||
    imageLinks?.smallThumbnail ||
    null;

  return {
    title: data.items?.[0]?.volumeInfo?.title ?? null,
    coverUrl,
  };
}
