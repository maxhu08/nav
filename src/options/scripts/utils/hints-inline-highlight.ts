import {
  hotkeysHintsCharsetHighlightEl,
  hotkeysHintsCharsetInputEl,
  hotkeysHintsCharsetStatusEl,
  hotkeysHintsPreferredSearchLabelsHighlightEl,
  hotkeysHintsPreferredSearchLabelsInputEl,
  hotkeysHintsPreferredSearchLabelsStatusEl
} from "~/src/options/scripts/ui";
import { setEditorStatus } from "~/src/options/scripts/utils/editor-status";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderCharsetHighlight = (value: string): { hasError: boolean; html: string } => {
  const seenCharacters = new Set<string>();
  let hasError = false;
  let html = "";

  for (const char of value) {
    const normalizedChar = char.toLowerCase();
    const isValidCharacter = /^[a-z]$/i.test(char);
    const isDuplicate = isValidCharacter && seenCharacters.has(normalizedChar);
    const isSpace = /\s/.test(char);
    const isValid = isValidCharacter && !isDuplicate && !isSpace;

    if (isValidCharacter) {
      seenCharacters.add(normalizedChar);
    }

    hasError ||= !isValid;
    html += wrapToken(
      isValid ? "hotkeys-hints-inline-token-valid" : "hotkeys-hints-inline-token-invalid",
      char
    );
  }

  return { hasError, html };
};

type PreferredSearchToken = {
  type: "label" | "space";
  value: string;
};

const tokenizePreferredSearchLabels = (value: string): PreferredSearchToken[] =>
  Array.from(value.matchAll(/ +|[^ ]+/g), (match) => {
    const token = match[0] ?? "";
    return {
      type: token.startsWith(" ") ? "space" : "label",
      value: token
    };
  });

const renderPreferredSearchLabelsHighlight = (
  value: string
): { hasError: boolean; html: string } => {
  const tokens = tokenizePreferredSearchLabels(value);
  let previousLabelLength: number | null = null;
  let hasError = false;
  let html = "";

  tokens.forEach((token, index) => {
    if (token.type === "space") {
      const isBoundarySpace = index === 0 || index === tokens.length - 1;
      const isSingleSeparator =
        token.value === " " &&
        tokens[index - 1]?.type === "label" &&
        tokens[index + 1]?.type === "label";
      const isValid = !isBoundarySpace && isSingleSeparator;

      hasError ||= !isValid;
      html += wrapToken(
        isValid ? "hotkeys-hints-inline-token-separator" : "hotkeys-hints-inline-token-invalid",
        token.value
      );
      return;
    }

    const isValidLabel = /^[a-z]+$/i.test(token.value);
    const hasExpectedLength =
      previousLabelLength === null || token.value.length === previousLabelLength + 1;
    const isValid = isValidLabel && hasExpectedLength;

    if (isValidLabel) {
      previousLabelLength = token.value.length;
    }

    hasError ||= !isValid;
    html += wrapToken(
      isValid ? "hotkeys-hints-inline-token-valid" : "hotkeys-hints-inline-token-invalid",
      token.value
    );
  });

  return { hasError, html };
};

export const syncHotkeysHintsCharsetHighlight = (): void => {
  const { hasError, html } = renderCharsetHighlight(hotkeysHintsCharsetInputEl.value);
  hotkeysHintsCharsetHighlightEl.innerHTML = html;
  setEditorStatus(hotkeysHintsCharsetStatusEl, hasError);
};

export const syncHotkeysHintsCharsetHighlightScroll = (): void => {
  hotkeysHintsCharsetHighlightEl.scrollLeft = hotkeysHintsCharsetInputEl.scrollLeft;
};

export const syncHotkeysHintsPreferredSearchLabelsHighlight = (): void => {
  const { hasError, html } = renderPreferredSearchLabelsHighlight(
    hotkeysHintsPreferredSearchLabelsInputEl.value
  );

  hotkeysHintsPreferredSearchLabelsHighlightEl.innerHTML = html;
  setEditorStatus(hotkeysHintsPreferredSearchLabelsStatusEl, hasError);
};

export const syncHotkeysHintsPreferredSearchLabelsHighlightScroll = (): void => {
  hotkeysHintsPreferredSearchLabelsHighlightEl.scrollLeft =
    hotkeysHintsPreferredSearchLabelsInputEl.scrollLeft;
};
