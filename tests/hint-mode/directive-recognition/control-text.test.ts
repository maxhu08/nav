import { describe, expect, test } from "bun:test";
import { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import { MARKER_VARIANT_ATTRIBUTE } from "~/src/core/utils/hint-mode/shared/constants";
import { createDomFixture } from "~/tests/helpers/dom-fixture";
import { directiveLabels } from "~/tests/hint-mode/directive-recognition/shared";

describe("directive recognition control text", () => {
  test("does not treat keyword-heavy title links as directive controls", () => {
    const fixture = createDomFixture(`
      <main>
        <a id="title-link" href="/watch?v=1">
          alpha favorite share comment copy delete notification dislike save cancel submit like
        </a>
        <button id="save-button" type="button" aria-label="Save article"></button>
        <button id="share-button" type="button" aria-label="Share this page"></button>
        <button id="comment-button" type="button" aria-label="Write a comment"></button>
        <button id="copy-button" type="button" aria-label="Copy link"></button>
        <button id="delete-button" type="button" aria-label="Delete message"></button>
        <button id="notification-button" type="button" aria-label="Notifications"></button>
        <button id="cancel-button" type="button">Cancel</button>
        <button id="like-button" type="button" aria-label="Like"></button>
        <button id="dislike-button" type="button" aria-label="Dislike"></button>
        <form>
          <input id="submit-button" type="submit" value="Send" />
        </form>
      </main>
    `);

    try {
      const targets = buildHintTargets("current-tab", "abcd", 1, false, directiveLabels);
      const titleDirectiveTargets = targets.filter(
        (target) => target.element.id === "title-link" && !!target.directiveMatch
      );
      const findDirectiveTarget = (id: string, directive: string) => {
        return targets.find(
          (target) => target.element.id === id && target.directiveMatch?.directive === directive
        );
      };

      expect(titleDirectiveTargets).toHaveLength(0);
      expect(findDirectiveTarget("save-button", "save")?.label).toBe("sv");
      expect(findDirectiveTarget("share-button", "share")?.label).toBe("sh");
      expect(findDirectiveTarget("comment-button", "comment")?.label).toBe("km");
      expect(findDirectiveTarget("copy-button", "copy")?.label).toBe("cp");
      expect(findDirectiveTarget("delete-button", "delete")?.label).toBe("dd");
      expect(findDirectiveTarget("notification-button", "notification")?.label).toBe("nf");
      expect(findDirectiveTarget("cancel-button", "cancel")?.label).toBe("no");
      expect(findDirectiveTarget("like-button", "like")?.label).toBe("iu");
      expect(findDirectiveTarget("dislike-button", "dislike")?.label).toBe("oi");
      expect(findDirectiveTarget("submit-button", "submit")?.label).toBe("ok");
      expect(
        targets
          .find((target) => target.element.id === "title-link")
          ?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)
      ).toBe("default");
    } finally {
      fixture.cleanup();
    }
  });
});