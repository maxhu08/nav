import { describe, expect, test } from "bun:test";
import { parseHotkeyMappingsValue } from "~/src/utils/hotkeys";

describe("parseHotkeyMappingsValue", () => {
  test("treats <unbound> actions as declared without creating bindings", () => {
    const parsed = parseHotkeyMappingsValue(`j scroll-down
<unbound> scroll-up
<unbound> scroll-left
<unbound> scroll-right
<unbound> scroll-half-page-down
<unbound> scroll-half-page-up
<unbound> scroll-to-top
<unbound> scroll-to-bottom
<unbound> hint-mode-current-tab
<unbound> hint-mode-new-tab
<unbound> hint-mode-right-click
<unbound> create-new-tab
<unbound> close-current-tab
<unbound> close-tabs-other
<unbound> close-tabs-left
<unbound> close-tabs-right
<unbound> reload-current-tab
<unbound> reload-current-tab-hard
<unbound> tab-go-prev
<unbound> tab-go-next
<unbound> first-tab
<unbound> last-tab
<unbound> move-tab-left
<unbound> move-tab-right
<unbound> restore-closed-tab
<unbound> visit-previous-tab
<unbound> duplicate-current-tab
<unbound> duplicate-current-tab-origin
<unbound> move-current-tab-to-new-window
<unbound> yank-link-url
<unbound> yank-image
<unbound> yank-image-url
<unbound> yank-current-tab-url
<unbound> yank-current-tab-url-clean
<unbound> history-go-prev
<unbound> history-go-next
<unbound> follow-prev
<unbound> follow-next
<unbound> find-mode
<unbound> bar-mode-current-tab
<unbound> bar-mode-new-tab
<unbound> bar-mode-edit-current-tab
<unbound> cycle-match-next
<unbound> cycle-match-prev
<unbound> watch-mode
<unbound> toggle-fullscreen
<unbound> toggle-play-pause
<unbound> toggle-loop
<unbound> toggle-mute
<unbound> toggle-captions`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.mappings).toEqual({
      j: {
        normal: "scroll-down"
      }
    });
  });

  test("allows named tokens for reserved keys in sequences", () => {
    const parsed = parseHotkeyMappingsValue(`<chevronleft><chevronright> create-new-tab
<hashtag> close-current-tab`);

    expect(parsed.errors.some((error) => error.code === "invalid-action")).toBe(false);
    expect(parsed.mappings).toEqual({
      "<chevronleft><chevronright>": {
        normal: "create-new-tab"
      },
      "<hashtag>": {
        normal: "close-current-tab"
      }
    });
  });

  test("reports missing action declarations", () => {
    const parsed = parseHotkeyMappingsValue("j scroll-down");

    expect(parsed.errors.some((error) => error.code === "missing-action-declaration")).toBe(true);
    expect(
      parsed.errors.some(
        (error) =>
          error.code === "missing-action-declaration" &&
          error.message.includes('Declare "scroll-up" or set it to "<unbound>".')
      )
    ).toBe(true);
  });
});