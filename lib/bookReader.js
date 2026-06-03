import { DOMParser } from "@xmldom/xmldom";
import * as FileSystem from "expo-file-system/legacy";
import { strFromU8, unzipSync } from "fflate";
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
const PALMDOC_COMPRESSION = 2;
const PALMDOC_NONE = 1;
const HUFF_CDIC_COMPRESSION = 17480;
const CP1252_EXTENDED = {
  0x80: "€",
  0x82: "‚",
  0x83: "ƒ",
  0x84: "„",
  0x85: "…",
  0x86: "†",
  0x87: "‡",
  0x88: "ˆ",
  0x89: "‰",
  0x8a: "Š",
  0x8b: "‹",
  0x8c: "Œ",
  0x8e: "Ž",
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
  0x98: "˜",
  0x99: "™",
  0x9a: "š",
  0x9b: "›",
  0x9c: "œ",
  0x9e: "ž",
  0x9f: "Ÿ",
};

const parsedBookCache = new Map();

function collapseWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildFallbackParagraphs(book) {
  const description = collapseWhitespace(book?.description);
  if (description && description !== "Sinopsis pendiente para este tomo.") {
    return description
      .split(/(?<=[.!?])\s+/)
      .map((paragraph) => collapseWhitespace(paragraph))
      .filter(Boolean);
  }

  return [
    "No se ha podido extraer una vista previa legible de este tomo.",
    "Prueba a abrirlo de nuevo o vuelve a importarlo si el contenido parece incompleto.",
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

function stripTags(value) {
  return collapseWhitespace(
    String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
  );
}

function extractParagraphsFromHtmlishMarkup(markup) {
  const normalized = String(markup || "")
    .replace(/<mbp:pagebreak[^>]*>/gi, "\n\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|section|blockquote|pre|h[1-6])>/gi, "\n\n")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ");

  return normalized
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s{2,}/))
    .map((paragraph) => collapseWhitespace(paragraph))
    .filter(Boolean);
}

function extractSectionsFromHtmlishMarkup(markup, fallbackTitle) {
  const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const sections = [];
  let activeTitle = fallbackTitle || "Capitulo";
  let lastIndex = 0;
  let match;

  while ((match = headingPattern.exec(markup))) {
    const beforeHeading = markup.slice(lastIndex, match.index);
    const paragraphs = extractParagraphsFromHtmlishMarkup(beforeHeading);

    if (paragraphs.length > 0) {
      sections.push({
        title: activeTitle,
        paragraphs,
        kind: sections.length === 0 ? "markup" : "heading",
      });
    }

    activeTitle = stripTags(match[2]) || activeTitle;
    lastIndex = headingPattern.lastIndex;
  }

  const trailingMarkup = markup.slice(lastIndex);
  const trailingParagraphs = extractParagraphsFromHtmlishMarkup(trailingMarkup);

  if (trailingParagraphs.length > 0) {
    sections.push({
      title: activeTitle,
      paragraphs: trailingParagraphs,
      kind: sections.length === 0 ? "markup" : "heading",
    });
  }

  return sections;
}

function splitPlainTextIntoParagraphs(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, " ")
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s{2,}/))
    .map((paragraph) => collapseWhitespace(paragraph))
    .filter(Boolean);
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

function buildSyntheticChapters(pageCount, baseTitle = "Capitulo") {
  const safePageCount = Math.max(pageCount || 0, 1);
  const chapterSize = safePageCount <= 12 ? 4 : safePageCount <= 36 ? 6 : 10;
  const synthetic = [];

  for (let pageIndex = 0; pageIndex < safePageCount; pageIndex += chapterSize) {
    const chapterNumber = synthetic.length + 1;
    synthetic.push({
      id: `synthetic-${chapterNumber}-${pageIndex}`,
      title: `${baseTitle} ${chapterNumber}`,
      pageIndex,
      kind: "synthetic",
    });
  }

  return synthetic.length > 0
    ? synthetic
    : [{ id: "synthetic-1-0", title: `${baseTitle} 1`, pageIndex: 0, kind: "synthetic" }];
}

function ensureChapterAccess(chapters, pages) {
  const normalized = Array.isArray(chapters) ? chapters.filter((chapter) => Number.isInteger(chapter?.pageIndex)) : [];
  const safePages = Array.isArray(pages) ? pages : [];

  if (safePages.length <= 1) {
    return normalized.length > 0
      ? normalized
      : [{ id: "inicio-0", title: "Inicio", pageIndex: 0, kind: "synthetic" }];
  }

  if (normalized.length >= 2) {
    return normalized;
  }

  return buildSyntheticChapters(safePages.length, normalized[0]?.title || "Capitulo");
}

function buildPageBudget({ width, height, fontScale, lineHeight, fontWeight, baseFontSize }) {
  const surfaceWidth = Math.max(width, 260);
  const surfaceHeight = Math.max(height, 260);
  const resolvedBaseFontSize =
    typeof baseFontSize === "number" ? baseFontSize : width >= 768 ? 22 : 21;
  const fontSize = resolvedBaseFontSize * fontScale;
  const lineSize = Math.max(fontSize * lineHeight, fontSize + 8);
  const weightFactor = fontWeight === "strong" ? 1.04 : 1;
  const averageCharWidth = Math.max(fontSize * 0.54 * weightFactor, 8);
  const charsPerLine = Math.max(22, Math.floor(surfaceWidth / averageCharWidth));
  const linesPerPage = Math.max(8, Math.floor(surfaceHeight / lineSize));
  const tabletBoost = width >= 768 ? 1.08 : 1;

  return Math.max(420, Math.floor(charsPerLine * linesPerPage * 0.92 * tabletBoost));
}

function readUint16BE(bytes, offset) {
  return ((bytes[offset] || 0) << 8) | (bytes[offset + 1] || 0);
}

function readUint32BE(bytes, offset) {
  return (
    ((bytes[offset] || 0) << 24) >>> 0 |
    ((bytes[offset + 1] || 0) << 16) |
    ((bytes[offset + 2] || 0) << 8) |
    (bytes[offset + 3] || 0)
  ) >>> 0;
}

function concatByteChunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function splitPalmDatabaseRecords(bytes) {
  const recordCount = readUint16BE(bytes, 76);
  const offsets = [];

  for (let index = 0; index < recordCount; index += 1) {
    offsets.push(readUint32BE(bytes, 78 + index * 8));
  }

  return offsets
    .map((start, index) => {
      const end = offsets[index + 1] || bytes.length;
      return bytes.slice(start, end);
    })
    .filter((record) => record.length > 0);
}

function decodePalmDocRecord(record) {
  const output = [];

  for (let index = 0; index < record.length; index += 1) {
    const value = record[index];

    if (value === 0) {
      output.push(0);
      continue;
    }

    if (value >= 1 && value <= 8) {
      const literalLength = Math.min(value, record.length - index - 1);
      for (let literalIndex = 0; literalIndex < literalLength; literalIndex += 1) {
        output.push(record[index + 1 + literalIndex]);
      }
      index += literalLength;
      continue;
    }

    if (value <= 0x7f) {
      output.push(value);
      continue;
    }

    if (value <= 0xbf) {
      if (index + 1 >= record.length) {
        break;
      }

      const next = record[index + 1];
      const distance = ((((value & 0x3f) << 8) | next) >> 3);
      const length = (next & 0x07) + 3;
      const start = output.length - distance;

      for (let copyIndex = 0; copyIndex < length; copyIndex += 1) {
        const sourceIndex = start + copyIndex;
        output.push(sourceIndex >= 0 ? output[sourceIndex] : 32);
      }

      index += 1;
      continue;
    }

    output.push(32, value ^ 0x80);
  }

  return Uint8Array.from(output);
}

function decodeCp1252(bytes) {
  let output = "";

  for (const value of bytes) {
    if (value >= 0x80 && value <= 0x9f) {
      output += CP1252_EXTENDED[value] || " ";
      continue;
    }

    output += String.fromCharCode(value);
  }

  return output;
}

function decodeTextBytes(bytes, encoding) {
  if (!bytes || bytes.length === 0) {
    return "";
  }

  if (encoding === 1252) {
    return decodeCp1252(bytes);
  }

  try {
    return strFromU8(bytes);
  } catch {
    return decodeCp1252(bytes);
  }
}

function sanitizeMobiMarkup(rawText) {
  const trimmedStartIndex = rawText.search(/<(?:html|body|p|div|h1|h2|h3|mbp:pagebreak)/i);
  let cleaned = trimmedStartIndex >= 0 ? rawText.slice(trimmedStartIndex) : rawText;
  const htmlEndIndex = cleaned.search(/<\/html>/i);

  if (htmlEndIndex >= 0) {
    cleaned = cleaned.slice(0, htmlEndIndex + 7);
  }

  return cleaned
    .replace(/\u0000/g, " ")
    .replace(/<guide[\s\S]*?<\/guide>/gi, " ")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
}

function getBookFormat(book) {
  const explicitFormat = String(book?.format || "").trim();
  if (explicitFormat) {
    return explicitFormat.toUpperCase();
  }

  const path = String(book?.localPath || book?.localUri || "");
  const extension = path.split(".").pop();
  return extension ? extension.toUpperCase() : "";
}

async function readArchiveBase64(uri) {
  const reader =
    Platform.OS === "android" && String(uri || "").startsWith("content://")
      ? FileSystem.StorageAccessFramework.readAsStringAsync
      : FileSystem.readAsStringAsync;

  return reader(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function extractEpubParagraphs(book) {
  const cacheKey = `epub:${book.localUri || book.localPath || book.id}`;
  const cached = parsedBookCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!book?.localUri || getBookFormat(book) !== "EPUB") {
    const fallback = {
      title: book?.title || "Tomo",
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

async function extractMobiParagraphs(book) {
  const cacheKey = `mobi:${book.localUri || book.localPath || book.id}`;
  const cached = parsedBookCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!book?.localUri || getBookFormat(book) !== "MOBI") {
    const fallback = {
      title: book?.title || "Tomo",
      sections: [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
      source: "preview",
    };
    parsedBookCache.set(cacheKey, fallback);
    return fallback;
  }

  const base64 = await readArchiveBase64(book.localUri);
  const bytes = base64ToUint8Array(base64);
  const records = splitPalmDatabaseRecords(bytes);
  const headerRecord = records[0];

  if (!headerRecord || headerRecord.length < 32) {
    const fallback = {
      title: book.title,
      sections: [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
      source: "preview",
    };
    parsedBookCache.set(cacheKey, fallback);
    return fallback;
  }

  const compression = readUint16BE(headerRecord, 0);
  const textRecordCount = readUint16BE(headerRecord, 8);
  const encoding = readUint32BE(headerRecord, 28);
  const mobiHeaderOffset = 16;
  const mobiMagic = decodeCp1252(headerRecord.slice(mobiHeaderOffset, mobiHeaderOffset + 4));
  const fullNameOffset = readUint32BE(headerRecord, mobiHeaderOffset + 84);
  const fullNameLength = readUint32BE(headerRecord, mobiHeaderOffset + 88);
  const embeddedTitle =
    mobiMagic === "MOBI" && fullNameLength > 0
      ? decodeTextBytes(
          headerRecord.slice(
            mobiHeaderOffset + fullNameOffset,
            mobiHeaderOffset + fullNameOffset + fullNameLength
          ),
          encoding
        )
      : "";

  if (compression === HUFF_CDIC_COMPRESSION) {
    const fallback = {
      title: collapseWhitespace(embeddedTitle) || book.title,
      sections: [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
      source: "preview",
    };
    parsedBookCache.set(cacheKey, fallback);
    return fallback;
  }

  const textChunks = [];
  const lastTextRecord = Math.min(textRecordCount, records.length - 1);

  for (let index = 1; index <= lastTextRecord; index += 1) {
    const record = records[index];

    if (!record) {
      continue;
    }

    if (compression === PALMDOC_COMPRESSION) {
      textChunks.push(decodePalmDocRecord(record));
      continue;
    }

    if (compression === PALMDOC_NONE) {
      textChunks.push(record);
    }
  }

  const mergedText = decodeTextBytes(concatByteChunks(textChunks), encoding);
  const cleanedMarkup = sanitizeMobiMarkup(mergedText);
  const looksLikeMarkup = /<(?:html|body|p|div|h[1-6]|br|mbp:pagebreak)/i.test(cleanedMarkup);
  const fallbackTitle = collapseWhitespace(embeddedTitle) || book.title;

  const sections = looksLikeMarkup
    ? extractSectionsFromHtmlishMarkup(cleanedMarkup, fallbackTitle)
    : [
        {
          title: fallbackTitle,
          paragraphs: splitPlainTextIntoParagraphs(mergedText),
          kind: "text",
        },
      ];

  const normalizedSections = sections.filter(
    (section) => Array.isArray(section?.paragraphs) && section.paragraphs.length > 0
  );

  const result = {
    title: fallbackTitle,
    sections:
      normalizedSections.length > 0
        ? normalizedSections
        : [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
    source: normalizedSections.length > 0 ? "mobi" : "preview",
  };

  parsedBookCache.set(cacheKey, result);
  return result;
}

export async function buildReaderDocument(book, layout) {
  const format = getBookFormat(book);
  const extracted =
    format === "EPUB"
      ? await extractEpubParagraphs(book)
      : format === "MOBI"
        ? await extractMobiParagraphs(book)
        : {
            title: book?.title || "Tomo",
            sections: [{ title: "Inicio", paragraphs: buildFallbackParagraphs(book) }],
            source: "preview",
          };
  const charBudget = buildPageBudget(layout);
  const paginated = paginateSections(extracted.sections, charBudget, buildFallbackParagraphs(book));
  const chapters = ensureChapterAccess(paginated.chapters, paginated.pages);

  return {
    title: extracted.title,
    source: extracted.source,
    pages: paginated.pages,
    chapters,
    pageCount: paginated.pages.length,
  };
}

function cleanChapterTitle(path, index) {
  const fileName = normalizeZipPath(path).split("/").at(-1) || "";
  const stem = collapseWhitespace(fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));

  return stem || `Capitulo ${index}`;
}
