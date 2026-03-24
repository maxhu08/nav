import {
  EXTERNAL_LINK_ICON_PATH,
  FILE_COPY_ICON_PATH,
  HINT_ATTACH_ICON_PATH,
  HINT_CANCEL_ICON_PATH,
  HINT_DELETE_ICON_PATH,
  HINT_DOWNLOAD_ICON_PATH,
  HINT_DISLIKE_ICON_PATH,
  HINT_FOCUS_MODE_ICON_PATH,
  HINT_HIDE_ICON_PATH,
  HINT_HOME_ICON_PATH,
  HINT_INPUT_ICON_PATH,
  HINT_LOGIN_ICON_PATH,
  HINT_LIKE_ICON_PATH,
  HINT_MICROPHONE_ICON_PATH,
  HINT_MORE_ICON_PATH,
  HINT_NEXT_ICON_PATH,
  HINT_PREV_ICON_PATH,
  HINT_SAVE_ICON_PATH,
  HINT_SHARE_ICON_PATH,
  HINT_SIDEBAR_ICON_PATH,
  HINT_SUBMIT_ICON_PATH,
  WATCH_PLAY_ICON_PATH
} from "~/src/lib/inline-icons";
import type { LinkMode } from "~/src/core/utils/hints/model";
import type {
  HintMarker,
  HintLabelIcon,
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
  icon.style.display = "block";
  if (options.hidden) {
    iconSlot.style.display = "none";
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
  if (hint.directive === "attach") {
    isVisible = false;
  }

  const icon = hint.thumbnailIcon;
  if (!icon) {
    return false;
  }

  const nextDisplay = isVisible ? "" : "none";
  if (icon.style.display === nextDisplay) {
    return false;
  }

  icon.style.display = nextDisplay;
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
  marker.style.display = "inline-flex";
  marker.style.alignItems = "center";
  marker.style.gap = "0.25em";

  const labelGroup = document.createElement("span");
  labelGroup.className = "nav-hint-marker-label";
  labelGroup.style.display = "inline-flex";
  labelGroup.style.alignItems = "center";

  const displayLabel = showCapitalizedLetters ? label.toUpperCase() : label.toLowerCase();
  const letters: HTMLSpanElement[] = [];

  for (const char of Array.from(displayLabel)) {
    const letter = document.createElement("span");
    letter.textContent = char;
    letter.setAttribute(attrs.letterAttribute, "pending");
    letter.setAttribute(attrs.letterStyleAttribute, "pending");
    labelGroup.appendChild(letter);
    letters.push(letter);
  }

  marker.appendChild(labelGroup);

  if (directive === "input") {
    appendMarkerIcon(marker, HINT_INPUT_ICON_PATH);
  } else if (directive === "attach") {
    appendMarkerIcon(marker, HINT_ATTACH_ICON_PATH);
  } else if (directive === "share") {
    appendMarkerIcon(marker, HINT_SHARE_ICON_PATH);
  } else if (directive === "download") {
    appendMarkerIcon(marker, HINT_DOWNLOAD_ICON_PATH);
  } else if (directive === "login") {
    appendMarkerIcon(marker, HINT_LOGIN_ICON_PATH);
  } else if (directive === "microphone") {
    appendMarkerIcon(marker, HINT_MICROPHONE_ICON_PATH);
  } else if (directive === "delete") {
    appendMarkerIcon(marker, HINT_DELETE_ICON_PATH);
  } else if (directive === "save") {
    appendMarkerIcon(marker, HINT_SAVE_ICON_PATH);
  } else if (directive === "copy") {
    appendMarkerIcon(marker, FILE_COPY_ICON_PATH);
  } else if (directive === "hide") {
    appendMarkerIcon(marker, HINT_HIDE_ICON_PATH);
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
  } else if (labelIcon === "collapse") {
    appendMarkerIcon(marker, HINT_FOCUS_MODE_ICON_PATH);
  } else if (labelIcon === "expand") {
    appendMarkerIcon(marker, HINT_FOCUS_MODE_ICON_PATH);
  } else if (labelIcon === "more") {
    appendMarkerIcon(marker, HINT_MORE_ICON_PATH);
  }

  if (mode === "copy-image") {
    appendMarkerIcon(marker, FILE_COPY_ICON_PATH);
  }

  const thumbnailIcon =
    mode === "new-tab"
      ? null
      : appendMarkerIcon(marker, WATCH_PLAY_ICON_PATH, {
          hidden: true
        });

  // Keep the new-tab affordance pinned to the far right.
  if (mode === "new-tab") {
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