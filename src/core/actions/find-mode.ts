import { isEditableTarget, getDeepActiveElement } from "~/src/core/utils/isEditableTarget";
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
  FIND_CURRENT_HIGHLIGHT_NAME,
  FIND_HIGHLIGHT_NAME,
  FIND_INPUT_ID,
  FIND_MATCH_COUNT_ID,
  FIND_NEXT_BUTTON_ID,
  FIND_OVERLAY_ID,
  FIND_PREV_BUTTON_ID,
  FIND_STATUS_ID,
  FIND_STATUS_TEXT_ID,
  getFindBar,
  getFindBarActions,
  getFindClearButton,
  getFindInput,
  getFindMatchCount,
  getFindNextButton,
  getFindOverlay,
  getFindPrevButton,
  getFindStatus,
  getFindStatusText,
  getFindUIRoot,
  isFindUIElement
} from "~/src/core/utils/get-ui";

type CoreMode = "normal" | "find" | "watch";

type FindMatch = {
  range: Range;
  element: HTMLElement;
};

type CreateFindModeControllerDeps = {
  getMode: () => CoreMode;
  setMode: (mode: CoreMode) => void;
  onFocusIndicator: (element: HTMLElement) => void;
  injectFindUIStyles: (root: ShadowRoot) => void;
};

type FindUIElements = {
  barActions: HTMLDivElement;
  matchCount: HTMLSpanElement;
  statusText: HTMLSpanElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
};

const getCssHighlights = (): {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
} | null => {
  const cssObject = globalThis.CSS as unknown as {
    highlights?: {
      set: (name: string, highlight: unknown) => void;
      delete: (name: string) => void;
    };
  };

  return cssObject.highlights ?? null;
};

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

export const createFindModeController = (deps: CreateFindModeControllerDeps) => {
  let findMatches: FindMatch[] = [];
  let findQuery = "";
  let currentFindMatchIndex = -1;
  let isFindStatusVisible = false;
  let findUIElements: FindUIElements | null = null;

  const clearFindHighlights = (): void => {
    const highlights = getCssHighlights();
    highlights?.delete(FIND_HIGHLIGHT_NAME);
    highlights?.delete(FIND_CURRENT_HIGHLIGHT_NAME);
  };

  const getFindCountLabel = (count: number): string => `${count} Matches`;

  const renderFindStatusLabel = (container: HTMLElement, index: number, count: number): void => {
    container.replaceChildren();

    const current = document.createElement("span");
    current.className = "nav-find-status-number";
    current.textContent = `${count > 0 ? index + 1 : 0}`;

    const separator = document.createElement("span");
    separator.className = "nav-find-status-separator";
    separator.textContent = " / ";

    const total = document.createElement("span");
    total.className = "nav-find-status-number";
    total.textContent = `${count}`;

    container.append(current, separator, total);
  };

  const resolveFindUIElements = (): FindUIElements | null => {
    if (findUIElements?.matchCount.isConnected === true) {
      return findUIElements;
    }

    const barActions = getFindBarActions();
    const matchCount = getFindMatchCount();
    const statusText = getFindStatusText();
    const prevButton = getFindPrevButton();
    const nextButton = getFindNextButton();
    const clearButton = getFindClearButton();

    if (!barActions || !matchCount || !statusText || !prevButton || !nextButton || !clearButton) {
      return null;
    }

    findUIElements = {
      barActions,
      matchCount,
      statusText,
      prevButton,
      nextButton,
      clearButton
    };

    return findUIElements;
  };

  const updateFindUICounts = (): void => {
    const ui = resolveFindUIElements();
    if (!ui) {
      return;
    }

    ui.matchCount.textContent = getFindCountLabel(findMatches.length);
    renderFindStatusLabel(ui.statusText, currentFindMatchIndex, findMatches.length);

    const hasMatches = findMatches.length > 0;
    const hasQuery = findQuery.length > 0;
    ui.barActions.setAttribute("data-visible", hasQuery ? "true" : "false");
    ui.prevButton.disabled = !hasMatches;
    ui.nextButton.disabled = !hasMatches;
    ui.clearButton.disabled = !hasQuery;
  };

  const applyFindHighlights = (): void => {
    clearFindHighlights();

    if (findMatches.length === 0 || typeof Highlight === "undefined") {
      return;
    }

    const highlights = getCssHighlights();
    if (!highlights) {
      return;
    }

    highlights.set(
      FIND_HIGHLIGHT_NAME,
      new Highlight(...findMatches.map((match) => match.range.cloneRange()))
    );

    const currentMatch = findMatches[currentFindMatchIndex];
    if (currentMatch) {
      highlights.set(FIND_CURRENT_HIGHLIGHT_NAME, new Highlight(currentMatch.range.cloneRange()));
    }
  };

  const isFindableTextContainer = (element: HTMLElement | null): element is HTMLElement => {
    if (!element) {
      return false;
    }

    if (
      element.closest(`#${FIND_BAR_ID}`) ||
      element.closest(`#${FIND_STATUS_ID}`) ||
      element.closest("[data-sonner-toaster]") ||
      element.closest("script, style, noscript, textarea, select, option")
    ) {
      return false;
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
      return false;
    }

    if (
      isEditableTarget(element) ||
      element.closest("[contenteditable='true'], [contenteditable='']")
    ) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      Number.parseFloat(style.opacity) !== 0
    );
  };

  const collectFindMatches = (query: string): FindMatch[] => {
    const normalizedQuery = query.toLowerCase();
    if (!normalizedQuery || !document.body) {
      return [];
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const matches: FindMatch[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode instanceof Text) {
        const parentElement = currentNode.parentElement;

        if (isFindableTextContainer(parentElement)) {
          const text = currentNode.textContent ?? "";
          const normalizedText = text.toLowerCase();
          let searchIndex = 0;

          while (searchIndex < normalizedText.length) {
            const matchIndex = normalizedText.indexOf(normalizedQuery, searchIndex);
            if (matchIndex === -1) {
              break;
            }

            const range = document.createRange();
            range.setStart(currentNode, matchIndex);
            range.setEnd(currentNode, matchIndex + normalizedQuery.length);

            if (range.getClientRects().length > 0) {
              matches.push({
                range,
                element: parentElement
              });
            }

            searchIndex = matchIndex + normalizedQuery.length;
          }
        }
      }

      currentNode = walker.nextNode();
    }

    return matches;
  };

  const focusCurrentFindMatch = (): void => {
    const currentMatch = findMatches[currentFindMatchIndex];

    if (!currentMatch) {
      updateFindUICounts();
      applyFindHighlights();
      return;
    }

    currentMatch.element.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "auto"
    });

    deps.onFocusIndicator(currentMatch.element);

    updateFindUICounts();
    applyFindHighlights();
  };

  const setFindQuery = (query: string): void => {
    findQuery = query;
    findMatches = collectFindMatches(query);
    currentFindMatchIndex = findMatches.length > 0 ? 0 : -1;
    updateFindUICounts();
    applyFindHighlights();
  };

  const hideFindBar = (): void => {
    getFindBar()?.setAttribute("data-visible", "false");

    if (!isFindStatusVisible) {
      deps.setMode("normal");
    }
  };

  const isFindInputFocused = (): boolean => {
    const root = getFindUIRoot();
    const input = getFindInput();

    if (!root || !input) {
      return false;
    }

    return getDeepActiveElement(root) === input || getDeepActiveElement() === input;
  };

  const clearFindInput = (): void => {
    const input = getFindInput();
    if (!input) {
      return;
    }

    input.value = "";
    setFindQuery("");
    input.focus();
  };

  const syncFindStatusVisibility = (): void => {
    getFindStatus()?.setAttribute("data-visible", isFindStatusVisible ? "true" : "false");
  };

  const clearFindSession = (): void => {
    findQuery = "";
    findMatches = [];
    currentFindMatchIndex = -1;
    isFindStatusVisible = false;
    clearFindHighlights();
    updateFindUICounts();
    syncFindStatusVisibility();
    hideFindBar();
    deps.setMode("normal");
  };

  const exitFindMode = (): void => {
    clearFindSession();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const commitFindQuery = (): boolean => {
    const query = getFindInput()?.value ?? "";
    setFindQuery(query);
    hideFindBar();

    if (query.length === 0) {
      isFindStatusVisible = false;
      syncFindStatusVisibility();
      clearFindHighlights();
      deps.setMode("normal");
      return false;
    }

    isFindStatusVisible = true;
    syncFindStatusVisibility();
    deps.setMode("find");
    focusCurrentFindMatch();
    return true;
  };

  const cycleFindMatch = (direction: 1 | -1): boolean => {
    if (findQuery.length === 0 || findMatches.length === 0) {
      return false;
    }

    currentFindMatchIndex =
      (currentFindMatchIndex + direction + findMatches.length) % findMatches.length;
    focusCurrentFindMatch();
    return true;
  };

  const createFindOverlay = (): { overlay: HTMLDivElement; existed: boolean } => {
    const existingOverlay = getFindOverlay();
    const overlay = existingOverlay ?? document.createElement("div");
    overlay.id = FIND_OVERLAY_ID;
    overlay.style.all = "initial";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2147483647";

    const root = overlay.shadowRoot ?? overlay.attachShadow({ mode: "open" });
    deps.injectFindUIStyles(root);

    return { overlay, existed: !!existingOverlay };
  };

  const createFindBar = (): {
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

  const createFindStatus = (): {
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

  const attachFindUIEventListeners = (
    input: HTMLInputElement,
    prevButton: HTMLButtonElement,
    nextButton: HTMLButtonElement,
    clearButton: HTMLButtonElement
  ): void => {
    input.addEventListener("input", () => {
      setFindQuery(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        commitFindQuery();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.key === "Escape") {
        exitFindMode();
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    });

    prevButton.addEventListener("click", () => {
      cycleFindMatch(-1);
    });

    nextButton.addEventListener("click", () => {
      cycleFindMatch(1);
    });

    clearButton.addEventListener("click", () => {
      clearFindInput();
    });
  };

  return {
    ensureFindUI: (): void => {
      if (getFindBar() && getFindStatus()) {
        return;
      }

      const { overlay, existed } = createFindOverlay();
      const root = overlay.shadowRoot ?? overlay.attachShadow({ mode: "open" });
      const { bar, actions, input, matchCount, clearButton } = createFindBar();
      const { status, statusText, prevButton, nextButton } = createFindStatus();

      root.append(bar, status);

      findUIElements = {
        barActions: actions,
        matchCount,
        statusText,
        prevButton,
        nextButton,
        clearButton
      };

      if (!existed) {
        document.documentElement.append(overlay);
      }

      attachFindUIEventListeners(input, prevButton, nextButton, clearButton);

      updateFindUICounts();
      syncFindStatusVisibility();
    },
    getFindQuery: (): string => findQuery,
    setFindQuery,
    hideFindBar,
    exitFindMode,
    cycleFindMatch,
    isFindModeActive: (): boolean => deps.getMode() === "find",
    isFindInputFocused,
    shouldIgnoreKeydownInFindUI: (event: KeyboardEvent): boolean => {
      if (deps.getMode() !== "find" || (!isFindUIElement(event.target) && !isFindInputFocused())) {
        return false;
      }

      if (event.key !== "Escape") {
        event.stopImmediatePropagation();
      }

      return true;
    }
  };
};