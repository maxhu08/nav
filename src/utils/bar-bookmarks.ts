export type BarBookmark = {
  name: string;
  value: string;
};

export const parseBarBookmarkLine = (value: string): BarBookmark | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(`{${trimmedValue}}`) as Record<string, unknown>;
    const entries = Object.entries(parsedValue);
    if (entries.length !== 1) {
      return null;
    }

    const entry = entries[0];
    if (!entry) {
      return null;
    }

    const name = entry[0].trim();
    const entryValue = typeof entry[1] === "string" ? entry[1].trim() : "";
    if (!name || !entryValue) {
      return null;
    }

    return { name, value: entryValue };
  } catch {
    return null;
  }
};

export const parseBarBookmarksValue = (value: unknown): BarBookmark[] => {
  if (typeof value !== "string") {
    return [];
  }

  const seen = new Set<string>();
  const bookmarks: BarBookmark[] = [];

  for (const line of value.split("\n")) {
    const bookmark = parseBarBookmarkLine(line);
    if (!bookmark || seen.has(bookmark.value.toLowerCase())) {
      continue;
    }

    seen.add(bookmark.value.toLowerCase());
    bookmarks.push(bookmark);
  }

  return bookmarks;
};