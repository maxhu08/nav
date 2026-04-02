import { describe, expect, test } from "bun:test";
import { parseReservedHintDirectives } from "~/src/utils/hint-reserved-label-directives";

describe("parseReservedHintDirectives", () => {
  test("treats <unbound> directives as empty labels", () => {
    const parsed = parseReservedHintDirectives("@input kj\n@erase <unbound>");

    expect(parsed.input).toEqual(["kj"]);
    expect(parsed.erase).toEqual([]);
  });
});