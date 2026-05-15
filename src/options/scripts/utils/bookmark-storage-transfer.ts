import { barSearchBookmarksStorageTextareaEl } from "~/src/options/scripts/ui";
import {
  syncBarSearchBookmarksStorageHighlight,
  syncBarSearchBookmarksStorageHighlightScroll
} from "~/src/options/scripts/utils/bar-bookmarks-highlight";
import { showInputDialog } from "~/src/options/scripts/utils/input-dialog";
import { saveConfigAndFastConfig } from "~/src/options/scripts/utils/save-config";
import { getToastApi } from "~/src/options/scripts/utils/sonner";
import { parseBarBookmarksValue } from "~/src/utils/bar-bookmarks";

const NAV_SAVE_PREFIX = "NAV_BOOKMARKS_FORMAT_";
const NAV_VERSIONED_SAVE_REGEX = /^NAV_BOOKMARKS_FORMAT_v[^_]+_(.+)$/;
const MTAB_SAVE_PREFIX = "MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_";
const MTAB_VERSIONED_SAVE_REGEX = /^MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v[^_]+_(.+)$/;
const IMPORT_NOTE =
  'Accepts NAV_BOOKMARKS_FORMAT_v#.#.#_{"content":"..."} and MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_[...]. MTAB folders are flattened.';

type MtabBookmarkNode = {
  type?: unknown;
  name?: unknown;
  url?: unknown;
  contents?: unknown;
};

const serializeBookmarks = (value: string): string => {
  const extensionVersion = chrome.runtime.getManifest().version;
  return `NAV_BOOKMARKS_FORMAT_v${extensionVersion}_${JSON.stringify({ content: value })}`;
};

const getBookmarkLine = (name: string, value: string): string => {
  return `${JSON.stringify(name)}: ${JSON.stringify(value)}`;
};

const flattenMtabBookmarks = (nodes: unknown): string[] => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.flatMap((node) => {
    const item = node as MtabBookmarkNode;

    if (item.type === "bookmark" && typeof item.name === "string" && typeof item.url === "string") {
      return [getBookmarkLine(item.name, item.url)];
    }

    if (item.type === "folder") {
      return flattenMtabBookmarks(item.contents);
    }

    return [];
  });
};

const parseNavBookmarks = (value: string): string | null => {
  if (!value.startsWith(NAV_SAVE_PREFIX)) {
    return null;
  }

  const versionedMatch = value.match(NAV_VERSIONED_SAVE_REGEX);
  if (!versionedMatch) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(versionedMatch[1].trim()) as { content?: unknown };
    return typeof parsedValue.content === "string" ? parsedValue.content : null;
  } catch {
    return null;
  }
};

const parseMtabBookmarks = (value: string): string | null => {
  if (!value.startsWith(MTAB_SAVE_PREFIX)) {
    return null;
  }

  const versionedMatch = value.match(MTAB_VERSIONED_SAVE_REGEX);
  if (!versionedMatch) {
    return null;
  }

  try {
    return flattenMtabBookmarks(JSON.parse(versionedMatch[1].trim())).join("\n");
  } catch {
    return null;
  }
};

const parseImportedBookmarks = (value: string): string | null => {
  return parseNavBookmarks(value) ?? parseMtabBookmarks(value);
};

const applyImportedBookmarks = async (
  importedValue: string,
  mode: "append" | "replace"
): Promise<void> => {
  const bookmarksValue = parseImportedBookmarks(importedValue);
  if (bookmarksValue === null) {
    getToastApi()?.error(
      "incorrect save format, expected NAV_BOOKMARKS_FORMAT_v#.#.#_ or MTAB_USER_USER_DEFINED_BOOKMARKS_FORMAT_v#.#.#_"
    );
    return;
  }

  barSearchBookmarksStorageTextareaEl.value =
    mode === "replace"
      ? bookmarksValue
      : [barSearchBookmarksStorageTextareaEl.value.trimEnd(), bookmarksValue.trim()]
          .filter(Boolean)
          .join("\n");

  syncBarSearchBookmarksStorageHighlight();
  syncBarSearchBookmarksStorageHighlightScroll();
  await saveConfigAndFastConfig();

  const importedBookmarks = parseBarBookmarksValue(bookmarksValue);
  getToastApi()?.success(
    `${importedBookmarks.length} bookmark${importedBookmarks.length === 1 ? "" : "s"} imported`
  );
};

export const exportAllBookmarks = async (): Promise<void> => {
  const bookmarks = parseBarBookmarksValue(barSearchBookmarksStorageTextareaEl.value);

  try {
    await navigator.clipboard.writeText(
      serializeBookmarks(barSearchBookmarksStorageTextareaEl.value)
    );
    getToastApi()?.success(
      `${bookmarks.length} bookmark${bookmarks.length === 1 ? "" : "s"} copied to clipboard`
    );
  } catch {
    getToastApi()?.error("could not copy bookmarks to clipboard");
  }
};

export const importBookmarks = async (): Promise<void> => {
  const importedValue = await showInputDialog("input your bookmarks to import", {
    confirmText: "ok",
    cancelText: "cancel",
    placeholder: "paste here...",
    note: IMPORT_NOTE
  });

  if (importedValue === null) {
    return;
  }

  if (importedValue.trim() === "") {
    getToastApi()?.info("input was empty, nothing imported");
    return;
  }

  await applyImportedBookmarks(importedValue, "append");
};

export const importAllBookmarks = async (): Promise<void> => {
  const importedValue = await showInputDialog(
    "input your bookmarks to import (THIS WILL OVERWRITE YOUR CURRENT BOOKMARKS)",
    {
      confirmText: "ok",
      cancelText: "cancel",
      placeholder: "paste here...",
      note: IMPORT_NOTE
    }
  );

  if (importedValue === null) {
    return;
  }

  if (importedValue.trim() === "") {
    getToastApi()?.info("input was empty, nothing imported");
    return;
  }

  await applyImportedBookmarks(importedValue, "replace");
};