import * as FileSystem from "expo-file-system";

function wait(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

export async function downloadBook(book, onProgress) {
  const extension = (book.format || "epub").toLowerCase();

  const directory = `${FileSystem.documentDirectory}books/`;
  const directoryInfo = await FileSystem.getInfoAsync(directory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  const filePath = `${directory}${book.title.replace(/[^a-z0-9]/gi, "_")}.${extension}`;
  for (let step = 1; step <= 10; step += 1) {
    await wait(90);
    onProgress?.(step / 10);
  }
  await FileSystem.writeAsStringAsync(filePath, `Copia local preparada para ${book.title}`);
  return filePath;
}
