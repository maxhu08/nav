import {
  EXTERNAL_LINK_ICON_PATH,
  FILE_COPY_ICON_PATH,
  HINT_CANCEL_ICON_PATH,
  HINT_DISLIKE_ICON_PATH,
  HINT_HOME_ICON_PATH,
  HINT_LIKE_ICON_PATH,
  HINT_NEXT_ICON_PATH,
  HINT_PREV_ICON_PATH,
  HINT_SEARCH_ICON_PATH,
  HINT_SIDEBAR_ICON_PATH,
  HINT_SUBMIT_ICON_PATH
} from "~/src/lib/inline-icons";
import type { LinkMode } from "~/src/core/utils/hints/hint-recognition";
import type {
  HintMarker,
  MarkerDomAttributes,
  ReservedHintDirective
} from "~/src/core/utils/hints/types";

export const setMarkerTypedState = (
  hint: HintMarker,
  typed: string,
  attrs: MarkerDomAttributes
): void => {
  if (hint.renderedTyped === typed) {
    return;
  }

  const typedLength = typed.length;
  const previousTypedLength = hint.renderedTyped.length;
  const startIndex = Math.min(typedLength, previousTypedLength);
  const endIndex = Math.max(typedLength, previousTypedLength);

  for (let index = startIndex; index < endIndex; index += 1) {
    const letter = hint.letters[index];
    if (!letter) continue;

    const isTyped = index < typedLength;
    letter.setAttribute(attrs.letterAttribute, isTyped ? "typed" : "pending");
    letter.setAttribute(attrs.letterStyleAttribute, isTyped ? "typed" : "pending");
  }

  hint.renderedTyped = typed;
};

export const invalidateMarkerSize = (hint: HintMarker): void => {
  hint.markerWidth = 0;
  hint.markerHeight = 0;
  hint.sizeDirty = true;
};

const appendMarkerIcon = (marker: HTMLSpanElement, path: string): void => {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "1em");
  icon.setAttribute("height", "1em");
  icon.setAttribute("fill", "currentColor");
  icon.setAttribute("aria-hidden", "true");
  icon.style.flex = "0 0 auto";
  icon.style.marginLeft = "0.25em";

  const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  iconPath.setAttribute("d", path);
  icon.append(iconPath);
  marker.append(icon);
};

export const createHintMarker = (
  label: string,
  directive: ReservedHintDirective | null,
  mode: LinkMode,
  showCapitalizedLetters: boolean,
  attrs: MarkerDomAttributes
): Pick<
  HintMarker,
  "marker" | "letters" | "renderedTyped" | "markerWidth" | "markerHeight" | "sizeDirty"
> => {
  const marker = document.createElement("span");
  marker.setAttribute(attrs.markerAttribute, "true");
  marker.setAttribute(attrs.markerStyleAttribute, "true");
  marker.setAttribute(attrs.markerVariantStyleAttribute, "default");
  marker.setAttribute("aria-hidden", "true");

  marker.style.position = "fixed";
  marker.style.left = "0px";
  marker.style.top = "0px";
  marker.style.display = "inline-flex";
  marker.style.alignItems = "center";
  marker.style.gap = "0";

  const displayLabel = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();
  const letters: HTMLSpanElement[] = [];

  for (const char of Array.from(displayLabel)) {
    const letter = document.createElement("span");
    letter.textContent = char;
    letter.setAttribute(attrs.letterAttribute, "pending");
    letter.setAttribute(attrs.letterStyleAttribute, "pending");
    marker.appendChild(letter);
    letters.push(letter);
  }

  if (directive === "search") {
    appendMarkerIcon(marker, HINT_SEARCH_ICON_PATH);
  } else if (directive === "home") {
    appendMarkerIcon(marker, HINT_HOME_ICON_PATH);
  } else if (directive === "sidebar") {
    appendMarkerIcon(marker, HINT_SIDEBAR_ICON_PATH);
  } else if (directive === "next") {
    appendMarkerIcon(marker, HINT_NEXT_ICON_PATH);
  } else if (directive === "prev") {
    appendMarkerIcon(marker, HINT_PREV_ICON_PATH);
  } else if (directive === "cancel") {
    appendMarkerIcon(marker, HINT_CANCEL_ICON_PATH);
  } else if (directive === "submit") {
    appendMarkerIcon(marker, HINT_SUBMIT_ICON_PATH);
  } else if (directive === "like") {
    appendMarkerIcon(marker, HINT_LIKE_ICON_PATH);
  } else if (directive === "dislike") {
    appendMarkerIcon(marker, HINT_DISLIKE_ICON_PATH);
  }

  if (mode === "new-tab") {
    appendMarkerIcon(marker, EXTERNAL_LINK_ICON_PATH);
  }

  if (mode === "copy-image") {
    appendMarkerIcon(marker, FILE_COPY_ICON_PATH);
  }

  return {
    marker,
    letters,
    renderedTyped: "",
    markerWidth: 0,
    markerHeight: 0,
    sizeDirty: true
  };
};