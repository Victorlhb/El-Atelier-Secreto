import { DOMParser } from "@xmldom/xmldom";
import * as FileSystem from "expo-file-system/legacy";
import { unzipSync, strFromU8 } from "fflate";
import { Platform } from "react-native";

const BLOCK_TAGS = new Set([
  "article",
  "blockquote",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "p",
  "pre",
  "section",
]);
const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

const parsedBookCache = new Map();

function collapseWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildFallbackParagraphs(book) {
  const description = collapseWhitespace(book?.description);
  if (
    description &&
    description !== "Sinopsis pendiente para este tomo." &&
    description !== "Disponible en tu dispositivo para lectura local."
  ) {
    return description
      .split(/(?<=[.!?])\s+/)
      .map((paragraph) => collapseWhitespace(paragraph))
      .filter(Boolean);
  }

  return [
    `${book?.title || "Este tomo"} esta guardado en tu dispositivo.`,
    "Todavia no hay una vista previa legible para este formato, pero puedes conservar el progreso y retomarlo despues.",
  ];
}

function normalizeZipPath(value) {
  return decodeURIComponent(String(value || "").replace(/\\/g, "/").replace(/^\.\//, ""));
}

function getDirectoryPath(value) {
  const normalized = normalizeZipPath(value);
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? "" : normalized.slice(0, lastSlash + 1);
}

function resolveRelativePath(baseDirectory, href) {
  const cleanHref = normalizeZipPath(String(href || "").split("#")[0]);
  if (!cleanHref) {
    return "";
  }

  if (!baseDirectory) {
    return cleanHref;
  }

  const segments = `${baseDirectory}${cleanHref}`.split("/");
  const resolved = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      resolved.pop();
      continue;
    }

    resolved.push(segment);
  }

  return resolved.join("/");
}

function base64ToUint8Array(base64) {
  const binary =
    typeof globalThis.atob === "function"
      ? globalThis.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function readTextFile(files, path) {
  const normalized = normalizeZipPath(path);
  const direct = files.get(normalized);

  if (direct) {
    return strFromU8(direct);
  }

  const fallback = files.get(normalized.replace(/^\//, ""));
  return fallback ? strFromU8(fallback) : "";
}

function parseXmlDocument(xml) {
  return new DOMParser({
    onError: () => {},
  }).parseFromString(xml, "text/xml");
}

function hasNestedBlockChildren(node) {
  if (!node?.childNodes) {
    return false;
  }

  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes[index];
    if (child.nodeType === 1 && BLOCK_TAGS.has(String(child.nodeName || "").toLowerCase())) {
      return true;
    }
  }

  return false;
}

function collectParagraphs(node, output) {
  if (!node) {
    return;
  }

  if (node.nodeType === 1) {
    const name = String(node.nodeName || "").toLowerCase();
    if (name === "script" || name === "style" || name === "svg" || name === "nav") {
      return;
    }

    if (BLOCK_TAGS.has(name)) {
      if (hasNestedBlockChildren(node)) {
        for (let index = 0; index < node.childNodes.length; index += 1) {
          collectParagraphs(node.childNodes[index], output);
        }
        return;
      }

      const text = collapseWhitespace(node.textContent);
      if (text) {
        output.push(text);
      }
      return;
    }

    for (let index = 0; index < node.childNodes.length; index += 1) {
      collectParagraphs(node.childNodes[index], output);
    }
  }
}

function extractParagraphsFromMarkup(markup) {
  const doc = parseXmlDocument(markup);
  const body = doc.getElementsByTagName("body")[0] || doc.documentElement;
  const paragraphs = [];

  collectParagraphs(body, paragraphs);
  return paragraphs.filter(Boolean);
}

function extractSectionFromMarkup(markup, fallbackTitle) {
  const doc = parseXmlDocument(markup);
  const body = doc.getElementsByTagName("body")[0] || doc.documentElement;
  const paragraphs = [];
  let title = "";
  let kind = "fallback";

  for (const headingTag of HEADING_TAGS) {
    const headingNode = body.getElementsByTagName?.(headingTag)?.[0];
    const headingText = collapseWhitespace(headingNode?.textContent);

    if (headingText) {
      title = headingText;
      kind = "heading";
      break;
    }
  }

  if (!title) {
    const titleNode = doc.getElementsByTagName("title")[0];
    title = collapseWhitespace(titleNode?.textContent);
    if (title) {
      kind = "title";
    }
  }

  collectParagraphs(body, paragraphs);

  return {
    title: title || fallbackTitle || "Capitulo",
    paragraphs: paragraphs.filter(Boolean),
    kind,
  };
}

function splitLongParagraph(paragraph, maxLength) {
  if (paragraph.length <= maxLength) {
    return [paragraph];
  }

  const words = paragraph.split(/\s+/);
  const chunks = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function paginateSections(sections, charBudget, fallbackParagraphs) {
  const pages = [];
  const chapters = [];
  let currentPage = [];
  let currentLength = 0;

  const normalizedSections =
    Array.isArray(sections) && sections.length > 0
      ? sections.filter((section) => Array.isArray(section?.paragraphs) && section.paragraphs.length > 0)
      : [{ title: "Inicio", paragraphs: fallbackParagraphs }];

  for (const section of normalizedSections) {
    chapters.push({
      id: `${pages.length}-${collapseWhitespace(section.title)}`,
      title: collapseWhitespace(section.title) || "Capitulo",
      pageIndex: pages.length,
      kind: section.kind || "fallback",
    });

    const flattened = section.paragraphs.flatMap((paragraph) =>
      splitLongParagraph(paragraph, Math.max(360, Math.floor(charBudget * 0.8)))
    );

    for (const paragraph of flattened) {
      const blockLength = paragraph.length + 24;

      if (currentPage.length > 0 && currentLength + blockLength > charBudget) {
        pages.push(currentPage);
        currentPage = [paragraph];
        currentLength = blockLength;
        continue;
      }

      currentPage.push(paragraph);
      currentLength += blockLength;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  const resolvedPages = pages.length > 0 ? pages : [fallbackParagraphs];

  return {
    pages: resolvedPages,
    chapters:
      chapters.length > 0
        ? chapters
        : [{ id: "inicio-0", title: "Inicio", pageIndex: 0 }],
  };
}

function buildPageBudget({ width, height, fontScale, lineHeight }) {
  const surfaceWidth = Math.max(width, 260);
  const surfaceHeight = Math.max(height, 260);
  const fontSize = 18 * fontScale;
  const lineSize = Math.max(fontSize * lineHeight, fontSize + 8);
  const averageCharWidth = Math.max(fontSize * 0.54, 8);
  const charsPerLine = Math.max(22, Math.floor(surfaceWidth / averageCharWidth));
  const linesPerPage = Math.max(8, Math.floor(surfaceHeight / lineSize));
  const tabletBoost = width >= 768 ? 1.08 : 1;

  return Math.max(420, Math.floor(charsPerLine * linesPerPage * 0.92 * tabletBoost));
}

async function readArchiveBase64(uri) {
  const reader =
    Platform.OS === "android" && String(uri || "").startsWith("content://")
      ? FileSystem.StorageAccessFramework.readAsStringAsync
      : FileSystem.readAsStringAsync;

  return reader(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function extractEpubParagraphs(book) {
  const cacheKey = book.localUri || book.localPath || book.id;
  const cached = parsedBookCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!book?.localUri || String(book.format || "").toUpperCase() !== "EPUB") {
    const fallback = {
      title: book?.title || "Tomo local",
      sections: [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
      source: "preview",
    };
    parsedBookCache.set(cacheKey, fallback);
    return fallback;
  }

  const base64 = await readArchiveBase64(book.localUri);
  const zippedFiles = unzipSync(base64ToUint8Array(base64));
  const files = new Map(
    Object.entries(zippedFiles).map(([path, bytes]) => [normalizeZipPath(path), bytes])
  );

  const containerXml = readTextFile(files, "META-INF/container.xml");
  const containerDoc = parseXmlDocument(containerXml);
  const rootFile = containerDoc.getElementsByTagName("rootfile")[0];
  const opfPath = rootFile?.getAttribute("full-path") || "";

  if (!opfPath) {
    throw new Error("No se encontro la estructura del EPUB.");
  }

  const opfXml = readTextFile(files, opfPath);
  const opfDoc = parseXmlDocument(opfXml);
  const opfDirectory = getDirectoryPath(opfPath);

  const titleNode = opfDoc.getElementsByTagName("dc:title")[0] || opfDoc.getElementsByTagName("title")[0];
  const manifestItems = new Map();
  const itemNodes = opfDoc.getElementsByTagName("item");
  for (let index = 0; index < itemNodes.length; index += 1) {
    const item = itemNodes[index];
    manifestItems.set(item.getAttribute("id"), {
      href: item.getAttribute("href"),
      mediaType: item.getAttribute("media-type"),
    });
  }

  const spineNodes = opfDoc.getElementsByTagName("itemref");
  const sections = [];
  for (let index = 0; index < spineNodes.length; index += 1) {
    const idref = spineNodes[index].getAttribute("idref");
    const manifestItem = manifestItems.get(idref);
    if (!manifestItem?.href) {
      continue;
    }

    const mediaType = manifestItem.mediaType || "";
    if (!/html|xhtml/i.test(mediaType)) {
      continue;
    }

    const chapterPath = resolveRelativePath(opfDirectory, manifestItem.href);
    const chapterMarkup = readTextFile(files, chapterPath);
    if (!chapterMarkup) {
      continue;
    }

    const fallbackTitle = cleanChapterTitle(chapterPath, index + 1);
    const section = extractSectionFromMarkup(chapterMarkup, fallbackTitle);

    if (section.paragraphs.length > 0) {
      sections.push(section);
    }
  }

  const result = {
    title: collapseWhitespace(titleNode?.textContent) || book.title,
    sections: sections.length > 0 ? sections : [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
    source: sections.length > 0 ? "epub" : "preview",
  };

  parsedBookCache.set(cacheKey, result);
  return result;
}

export async function buildReaderDocument(book, layout) {
  const extracted = await extractEpubParagraphs(book);
  const charBudget = buildPageBudget(layout);
  const paginated = paginateSections(extracted.sections, charBudget, buildFallbackParagraphs(book));

  return {
    title: extracted.title,
    source: extracted.source,
    pages: paginated.pages,
    chapters: paginated.chapters,
    pageCount: paginated.pages.length,
  };
}

function cleanChapterTitle(path, index) {
  const fileName = normalizeZipPath(path).split("/").at(-1) || "";
  const stem = collapseWhitespace(fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));

  return stem || `Capitulo ${index}`;
}
