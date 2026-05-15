import { describe, expect, test } from "bun:test";
import {
  getBarSuggestionItems,
  getBookmarkSuggestions
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