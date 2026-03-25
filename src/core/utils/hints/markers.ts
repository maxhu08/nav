import {
  EXTERNAL_LINK_ICON_PATH,
  HINT_FOCUS_MODE_ICON_PATH,
  HINT_MORE_ICON_PATH,
  FILE_COPY_ICON_PATH,
  WATCH_PLAY_ICON_PATH
} from "~/src/lib/inline-icons";
import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";
import type { LinkMode } from "~/src/core/utils/hints/model";
import type {
  HintMarker,
  HintLabelIcon,
  MarkerDomAttributes,
  ReservedHintDirective
} from "~/src/core/utils/hints/types";

const LABEL_ICON_PATHS: Record<Exclude<HintLabelIcon, null>, string> = {
  collapse: HINT_FOCUS_MODE_ICON_PATH,
  expand: HINT_FOCUS_MODE_ICON_PATH,
  more: HINT_MORE_ICON_PATH
};

const setImportantStyle = (
  element: HTMLElement | SVGElement,
  property: string,
  value: string
): void => {
  element.style.setProperty(property, value, "important");
};

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

const appendMarkerIcon = (
  marker: HTMLSpanElement,
  path: string,
  options: { hidden?: boolean } = {}
): HTMLSpanElement => {
  const iconSlot = document.createElement("span");
  iconSlot.className = "nav-hint-marker-icon";

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "1em");
  icon.setAttribute("height", "1em");
  icon.setAttribute("fill", "currentColor");
  icon.setAttribute("aria-hidden", "true");
  setImportantStyle(iconSlot, "display", "inline-flex");
  setImportantStyle(iconSlot, "flex", "0 0 auto");
  setImportantStyle(iconSlot, "flex-direction", "row");
  setImportantStyle(iconSlot, "flex-wrap", "nowrap");
  setImportantStyle(iconSlot, "align-items", "center");
  setImportantStyle(iconSlot, "justify-content", "center");
  setImportantStyle(iconSlot, "align-self", "center");
  setImportantStyle(iconSlot, "white-space", "nowrap");
  setImportantStyle(icon, "display", "block");
  setImportantStyle(icon, "flex", "0 0 auto");
  if (options.hidden) {
    setImportantStyle(iconSlot, "display", "none");
  }

  const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  iconPath.setAttribute("d", path);
  icon.append(iconPath);
  iconSlot.append(icon);
  marker.append(iconSlot);
  return iconSlot;
};

export const setThumbnailMarkerIconVisibility = (
  hint: Pick<HintMarker, "directive" | "thumbnailIcon">,
  isVisible: boolean
): boolean => {
  if (hint.directive !== null) {
    isVisible = false;
  }

  const icon = hint.thumbnailIcon;
  if (!icon) {
    return false;
  }

  const isCurrentlyVisible = icon.style.getPropertyValue("display") !== "none";
  if (isCurrentlyVisible === isVisible) {
    return false;
  }

  if (isVisible) {
    setImportantStyle(icon, "display", "inline-flex");
  } else {
    setImportantStyle(icon, "display", "none");
  }

  return true;
};

export const createHintMarker = (
  label: string,
  directive: ReservedHintDirective | null,
  labelIcon: HintLabelIcon | null,
  mode: LinkMode,
  showCapitalizedLetters: boolean,
  attrs: MarkerDomAttributes
): Pick<
  HintMarker,
  | "marker"
  | "thumbnailIcon"
  | "letters"
  | "renderedTyped"
  | "markerWidth"
  | "markerHeight"
  | "sizeDirty"
> => {
  const marker = document.createElement("span");
  marker.setAttribute(attrs.markerAttribute, "true");
  marker.setAttribute(attrs.markerStyleAttribute, "true");
  marker.setAttribute(attrs.markerVariantStyleAttribute, "default");
  marker.setAttribute("aria-hidden", "true");

  marker.style.position = "fixed";
  marker.style.left = "0px";
  marker.style.top = "0px";
  setImportantStyle(marker, "display", "inline-flex");
  setImportantStyle(marker, "align-items", "center");
  setImportantStyle(marker, "justify-content", "flex-start");
  setImportantStyle(marker, "flex-direction", "row");
  setImportantStyle(marker, "flex-wrap", "nowrap");
  setImportantStyle(marker, "white-space", "nowrap");
  marker.style.gap = "0.25em";

  const shouldRenderDirectiveIconOnly = directive !== null;

  const labelGroup = document.createElement("span");
  labelGroup.className = "nav-hint-marker-label";
  setImportantStyle(labelGroup, "display", "inline-flex");
  setImportantStyle(labelGroup, "align-items", "center");
  setImportantStyle(labelGroup, "flex", "0 1 auto");
  setImportantStyle(labelGroup, "flex-direction", "row");
  setImportantStyle(labelGroup, "flex-wrap", "nowrap");
  setImportantStyle(labelGroup, "white-space", "nowrap");

  const displayLabel = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();
  const letters: HTMLSpanElement[] = [];

  for (const char of Array.from(displayLabel)) {
    const letter = document.createElement("span");
    letter.textContent = char;
    setImportantStyle(letter, "display", "inline-block");
    setImportantStyle(letter, "flex", "0 0 auto");
    setImportantStyle(letter, "white-space", "pre");
    letter.setAttribute(attrs.letterAttribute, "pending");
    letter.setAttribute(attrs.letterStyleAttribute, "pending");
    labelGroup.appendChild(letter);
    letters.push(letter);
  }

  marker.appendChild(labelGroup);

  if (directive !== null) {
    appendMarkerIcon(marker, HINT_DIRECTIVE_ICON_PATHS[directive]);
  } else if (labelIcon !== null) {
    appendMarkerIcon(marker, LABEL_ICON_PATHS[labelIcon]);
  }

  if (mode === "copy-image" && !shouldRenderDirectiveIconOnly) {
    appendMarkerIcon(marker, FILE_COPY_ICON_PATH);
  }

  const thumbnailIcon =
    shouldRenderDirectiveIconOnly || mode === "new-tab"
      ? null
      : appendMarkerIcon(marker, WATCH_PLAY_ICON_PATH, {
          hidden: true
        });

  // Keep the new-tab affordance pinned to the far right.
  if (mode === "new-tab" && !shouldRenderDirectiveIconOnly) {
    appendMarkerIcon(marker, EXTERNAL_LINK_ICON_PATH);
  }

  return {
    marker,
    thumbnailIcon,
    letters,
    renderedTyped: "",
    markerWidth: 0,
    markerHeight: 0,
    sizeDirty: true
  };
};