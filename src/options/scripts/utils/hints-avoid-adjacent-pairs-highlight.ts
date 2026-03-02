import {
  hotkeysHintsAvoidAdjacentPairsHighlightEl,
  hotkeysHintsAvoidAdjacentPairsTextareaEl
} from "~/src/options/scripts/ui";

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const wrapToken = (className: string, value: string): string =>
  `<span class="${className}">${escapeHtml(value)}</span>`;

const renderLine = (line: string): string => {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return "";
  }

  if (trimmedLine.startsWith("#")) {
    return wrapToken("hotkeys-hints-avoid-adjacent-pairs-token-comment", line);
  }

  const tokens: string[] = [];

  for (const match of line.matchAll(/\s+|\S+/g)) {
    const segment = match[0];

    if (/^\s+$/.test(segment)) {
      tokens.push(escapeHtml(segment));
      continue;
    }

    tokens.push(
      wrapToken(
        /^[a-z]{2}$/i.test(segment)
          ? "hotkeys-hints-avoid-adjacent-pairs-token-valid"
          : "hotkeys-hints-avoid-adjacent-pairs-token-invalid",
        segment
      )
    );
  }

  return tokens.join("");
};

export const normalizeAvoidAdjacentPairsValue = (value: string): string => {
  return value
    .replaceAll("\r", "")
    .replaceAll(/[^\S\n]+/g, " ")
    .replaceAll(/[^\sa-zA-Z#]/g, " ")
    .replaceAll(/ +\n/g, "\n")
    .replaceAll(/\n +/g, "\n");
};

export const syncHotkeysHintsAvoidAdjacentPairsHighlight = (): void => {
  hotkeysHintsAvoidAdjacentPairsHighlightEl.innerHTML =
    hotkeysHintsAvoidAdjacentPairsTextareaEl.value.split("\n").map(renderLine).join("\n");
};

export const syncHotkeysHintsAvoidAdjacentPairsHighlightScroll = (): void => {
  hotkeysHintsAvoidAdjacentPairsHighlightEl.scrollTop =
    hotkeysHintsAvoidAdjacentPairsTextareaEl.scrollTop;
  hotkeysHintsAvoidAdjacentPairsHighlightEl.scrollLeft =
    hotkeysHintsAvoidAdjacentPairsTextareaEl.scrollLeft;
};
