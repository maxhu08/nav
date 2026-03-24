import { describe, expect, test } from "bun:test";
import { getBaseUrl, getCleanUrl, getNormalizedUrl } from "~/src/utils/url";

describe("url utils", () => {
  test("getNormalizedUrl trims trailing slashes but keeps search and hash", () => {
    expect(getNormalizedUrl("https://example.com/path///?q=1#section")).toBe(
      "https://example.com/path?q=1#section"
    );
  });

  test("getBaseUrl keeps only the origin", () => {
    expect(getBaseUrl("https://example.com/path///?q=1#section")).toBe("https://example.com");
  });

  test("getCleanUrl removes common tracking params and preserves normal params", () => {
    expect(
      getCleanUrl(
        "https://example.com/watch/?feature=share&si=abc123&utm_source=youtube&fbclid=123&id=42#time"
      )
    ).toBe("https://example.com/watch?feature=share&id=42#time");
  });

  test("getCleanUrl removes repeated tracking params", () => {
    expect(getCleanUrl("https://example.com/?utm_source=a&utm_source=b&x=1")).toBe(
      "https://example.com?x=1"
    );
  });
});