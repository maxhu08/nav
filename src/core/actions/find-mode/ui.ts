import {
  FIND_ARROW_DOWN_ICON_NODES,
  FIND_ARROW_UP_ICON_NODES,
  FIND_CLOSE_ICON_NODES,
  FIND_SEARCH_ICON_NODES,
  type SvgNodeDefinition
} from "~/src/lib/inline-icons";
import {
  FIND_BAR_ID,
  FIND_CLEAR_BUTTON_ID,
  FIND_INPUT_ID,
  FIND_MATCH_COUNT_ID,
  FIND_NEXT_BUTTON_ID,
  FIND_OVERLAY_ID,
  FIND_PREV_BUTTON_ID,
  FIND_STATUS_ID,
  FIND_STATUS_TEXT_ID,
  getFindOverlay
} from "~/src/core/utils/get-ui";

const createFindIconSvg = (nodes: SvgNodeDefinition[]): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  for (const node of nodes) {
    const child = document.createElementNS("http://www.w3.org/2000/svg", node.tag);

    for (const [name, value] of Object.entries(node.attributes)) {
      child.setAttribute(name, value);
    }

    svg.appendChild(child);
  }

  return svg;
};

export const createFindOverlay = (
  injectFindUIStyles: (root: ShadowRoot) => void
): { overlay: HTMLDivElement; existed: boolean } => {
  const existingOverlay = getFindOverlay();
  const overlay = existingOverlay ?? document.createElement("div");
  overlay.id = FIND_OVERLAY_ID;
  overlay.style.all = "initial";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "2147483647";

  const root = overlay.shadowRoot ?? overlay.attachShadow({ mode: "open" });
  injectFindUIStyles(root);

  return { overlay, existed: !!existingOverlay };
};

export const createFindBar = (): {
  bar: HTMLDivElement;
  actions: HTMLDivElement;
  input: HTMLInputElement;
  matchCount: HTMLSpanElement;
  clearButton: HTMLButtonElement;
} => {
  const bar = document.createElement("div");
  bar.id = FIND_BAR_ID;
  bar.setAttribute("role", "search");
  bar.setAttribute("aria-label", "Find in page");
  bar.setAttribute("data-visible", "false");

  const icon = document.createElement("span");
  icon.className = "nav-find-icon";
  icon.setAttribute("data-find-icon", "");
  icon.appendChild(createFindIconSvg(FIND_SEARCH_ICON_NODES));

  const input = document.createElement("input");
  input.id = FIND_INPUT_ID;
  input.type = "text";
  input.spellcheck = false;
  input.autocomplete = "off";
  input.placeholder = "find...";
  input.setAttribute("aria-label", "Find in page query");
  input.setAttribute("aria-controls", FIND_STATUS_ID);

  const actions = document.createElement("div");
  actions.className = "nav-find-bar-actions";

  const matchCount = document.createElement("span");
  matchCount.id = FIND_MATCH_COUNT_ID;
  matchCount.setAttribute("role", "status");
  matchCount.setAttribute("aria-live", "polite");
  matchCount.setAttribute("aria-atomic", "true");
  matchCount.textContent = "0 Matches";

  const clearButton = document.createElement("button");
  clearButton.id = FIND_CLEAR_BUTTON_ID;
  clearButton.className = "nav-find-clear";
  clearButton.type = "button";
  clearButton.setAttribute("aria-label", "Clear find input");
  clearButton.setAttribute("aria-controls", FIND_INPUT_ID);
  clearButton.appendChild(createFindIconSvg(FIND_CLOSE_ICON_NODES));

  actions.append(matchCount, clearButton);
  bar.append(icon, input, actions);
  return { bar, actions, input, matchCount, clearButton };
};

export const createFindStatus = (): {
  status: HTMLDivElement;
  statusText: HTMLSpanElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
} => {
  const status = document.createElement("div");
  status.id = FIND_STATUS_ID;
  status.setAttribute("role", "group");
  status.setAttribute("aria-label", "Find matches");
  status.setAttribute("data-visible", "false");

  const statusText = document.createElement("span");
  statusText.id = FIND_STATUS_TEXT_ID;
  statusText.setAttribute("role", "status");
  statusText.setAttribute("aria-live", "polite");
  statusText.setAttribute("aria-atomic", "true");
  statusText.textContent = "0 / 0";

  const prevButton = document.createElement("button");
  prevButton.id = FIND_PREV_BUTTON_ID;
  prevButton.className = "nav-find-nav";
  prevButton.setAttribute("data-find-nav", "");
  prevButton.type = "button";
  prevButton.setAttribute("aria-label", "Previous match");
  prevButton.appendChild(createFindIconSvg(FIND_ARROW_UP_ICON_NODES));

  const nextButton = document.createElement("button");
  nextButton.id = FIND_NEXT_BUTTON_ID;
  nextButton.className = "nav-find-nav";
  nextButton.setAttribute("data-find-nav", "");
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Next match");
  nextButton.appendChild(createFindIconSvg(FIND_ARROW_DOWN_ICON_NODES));

  status.append(statusText, prevButton, nextButton);
  return { status, statusText, prevButton, nextButton };
};

export const attachFindUIEventListeners = (
  input: HTMLInputElement,
  prevButton: HTMLButtonElement,
  nextButton: HTMLButtonElement,
  clearButton: HTMLButtonElement,
  callbacks: {
    setFindQuery: (query: string) => void;
    commitFindQuery: () => boolean;
    exitFindMode: () => void;
    cycleFindMatch: (direction: 1 | -1) => boolean;
    clearFindInput: () => void;
  }
): void => {
  input.addEventListener("input", () => {
    callbacks.setFindQuery(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      callbacks.commitFindQuery();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.key === "Escape") {
      callbacks.exitFindMode();
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  });

  prevButton.addEventListener("click", () => {
    callbacks.cycleFindMatch(-1);
  });

  nextButton.addEventListener("click", () => {
    callbacks.cycleFindMatch(1);
  });

  clearButton.addEventListener("click", () => {
    callbacks.clearFindInput();
  });
};