import { describe, expect, test } from "bun:test";
import {
  getBarSuggestionItems,
  getBookmarkSuggestions,
  getTabSuggestions
} from "~/src/core/actions/find-mode/search-suggestions";

describe("bar bookmark suggestions", () => {
  test("prioritizes matching bookmarks over the raw query and other sources", () => {
    const items = getBarSuggestionItems("gh", [
      ...getBookmarkSuggestions([
        {
          name: "GitHub",
          value: "https://github.com/"
        }
      ]),
      {
        value: "gh search",
        displayValue: "gh search",
        source: "search",
        directLink: false
      },
      {
        value: "https://gh.example.com",
        displayValue: "https://gh.example.com",
        source: "history",
        directLink: true
      }
    ]);

    expect(items[0]?.source).toBe("bookmark");
    expect(items[0]?.displayValue).toBe("GitHub");
    expect(items[0]?.value).toBe("https://github.com/");
    expect(items[1]?.displayValue).toBe("gh");
  });
});

describe("bar tab suggestions", () => {
  const tabs = getTabSuggestions([
    { id: 1, title: "GitHub", url: "https://github.com/nav" },
    { id: 2, title: "GitHub", url: "https://github.com/nav" },
    { id: 3, title: "Documentation", url: "https://example.com/docs" }
  ]);

  test("matches titles and URLs case-insensitively without merging duplicate tabs", () => {
    expect(getBarSuggestionItems("GITHUB", tabs, true).map((item) => item.tabId)).toEqual([1, 2]);
    expect(getBarSuggestionItems("example.com", tabs, true).map((item) => item.tabId)).toEqual([3]);
  });

  test("keeps the raw query first in the normal bar", () => {
    const items = getBarSuggestionItems("github", tabs);
    expect(items[0]?.source).toBe("search");
    expect(items.slice(1).map((item) => item.tabId)).toEqual([1, 2]);
  });
});