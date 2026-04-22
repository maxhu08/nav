import { isEditableTarget, getDeepActiveElement } from "~/src/core/utils/is-editable-target";
import {
  FIND_BAR_ID,
  FIND_CURRENT_HIGHLIGHT_NAME,
  FIND_HIGHLIGHT_NAME,
  FIND_STATUS_ID,
  getFindBar,
  getFindBarActions,
  getFindClearButton,
  getFindInput,
  getFindMatchCount,
  getFindNextButton,
  getFindPrevButton,
  getFindStatus,
  getFindStatusText,
  getFindUIRoot,
  isFindUIElement
} from "~/src/core/utils/get-ui";
import {
  attachFindUIEventListeners,
  createFindBar,
  createFindOverlay,
  createFindStatus
} from "./ui";
import {
  activateSiteKeybindIgnore,
  deactivateSiteKeybindIgnore
} from "~/src/core/utils/ignore-site-keybinds";
import { DEFAULT_BAR_SEARCH_ENGINE_URL } from "~/src/utils/config";

type CoreMode = "normal" | "find" | "hint" | "watch";

type FindMatch = {
  range: Range;
  element: HTMLElement;
};

type PromptSession =
  | {
      kind: "find";
    }
  | {
      kind: "bar";
      mode: "current-tab" | "new-tab" | "edit-current-tab";
    };

const BAR_URL_TEXT_COLOR = "#3b82f6";

const looksLikeUrl = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return true;
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#]|$)/i.test(normalized)) {
    return true;
  }

  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(normalized);
};

const resolveBarNavigationUrl = (value: string): string | null => {
  const normalized = value.trim();
  if (!looksLikeUrl(normalized)) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

  try {
    const url = new URL(candidate);
    return /^https?:$/.test(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const resolveSearchUrl = (query: string, template: string): string => {
  const encodedQuery = encodeURIComponent(query);
  const normalizedTemplate = template.includes("{}") ? template : DEFAULT_BAR_SEARCH_ENGINE_URL;
  return normalizedTemplate.replaceAll("{}", encodedQuery);
};

const getSelectionAnchorRange = (): Range | null => {
  const selection = globalThis.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  if (!range.collapsed) {
    range.collapse(true);
  }

  return range;
};

const createBodyStartRange = (): Range | null => {
  if (!document.body) {
    return null;
  }

  const range = document.createRange();
  range.setStart(document.body, 0);
  range.setEnd(document.body, 0);
  return range;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasUpperCase = (value: string): boolean => /\p{Lu}/u.test(value);

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

export const createFindModeController = (deps: CreateFindModeControllerDeps) => {
  let findMatches: FindMatch[] = [];
  let findQuery = "";
  let currentFindMatchIndex = -1;
  let isFindStatusVisible = false;
  let findUIElements: FindUIElements | null = null;
  let findSessionAnchorRange: Range | null = null;
  let promptSession: PromptSession = { kind: "find" };
  let barSearchEngineURL = DEFAULT_BAR_SEARCH_ENGINE_URL;

  const getPromptKindAttribute = (): "find" | "current-tab" | "new-tab" | "edit-current-tab" => {
    return promptSession.kind === "find" ? "find" : promptSession.mode;
  };

  const getPromptPlaceholder = (): string => {
    if (promptSession.kind === "find") {
      return "find...";
    }

    if (promptSession.mode === "new-tab") {
      return "open url or search (new tab)...";
    }

    if (promptSession.mode === "edit-current-tab") {
      return "edit current url or search...";
    }

    return "open url or search...";
  };

  const ensureFindUIReady = (): { bar: HTMLDivElement; input: HTMLInputElement } | null => {
    if (!getFindBar() || !getFindStatus()) {
      const overlay = createFindOverlay(deps.injectFindUIStyles).overlay;
      const root = overlay.shadowRoot ?? overlay.attachShadow({ mode: "open" });
      const barUI = createFindBar();
      const statusUI = createFindStatus();

      root.append(barUI.bar, statusUI.status);

      findUIElements = {
        barActions: barUI.actions,
        matchCount: barUI.matchCount,
        statusText: statusUI.statusText,
        prevButton: statusUI.prevButton,
        nextButton: statusUI.nextButton,
        clearButton: barUI.clearButton
      };

      attachFindUIEventListeners(
        barUI.input,
        statusUI.prevButton,
        statusUI.nextButton,
        barUI.clearButton,
        {
          setFindQuery: (query: string) => {
            if (promptSession.kind === "find") {
              setFindQuery(query);
            } else {
              updateFindUICounts();
            }

            syncPromptKind();
          },
          commitFindQuery,
          exitFindMode,
          cycleFindMatch,
          clearFindInput
        }
      );

      syncPromptKind();
      updateFindUICounts();
      syncFindStatusVisibility();
    }

    const bar = getFindBar();
    const input = getFindInput();

    if (!bar || !input) {
      return null;
    }

    return { bar, input };
  };

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
    separator.textContent = "\u00a0/\u00a0";

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

  const syncPromptKind = (): void => {
    const bar = getFindBar();
    const input = getFindInput();

    if (!bar || !input) {
      return;
    }

    bar.setAttribute("data-prompt-kind", getPromptKindAttribute());
    input.placeholder = getPromptPlaceholder();
    input.setAttribute(
      "data-url-like",
      promptSession.kind === "bar" && looksLikeUrl(input.value) ? "true" : "false"
    );
    input.style.color =
      promptSession.kind === "bar" && looksLikeUrl(input.value) ? BAR_URL_TEXT_COLOR : "";
  };

  const updateFindUICounts = (): void => {
    const ui = resolveFindUIElements();
    if (!ui) {
      return;
    }

    ui.matchCount.textContent =
      promptSession.kind === "find" ? getFindCountLabel(findMatches.length) : "";
    renderFindStatusLabel(ui.statusText, currentFindMatchIndex, findMatches.length);

    const hasMatches = findMatches.length > 0;
    const hasQuery = (getFindInput()?.value ?? "").length > 0;
    ui.barActions.setAttribute("data-visible", hasQuery ? "true" : "false");
    ui.barActions.setAttribute("data-prompt-kind", promptSession.kind);
    ui.matchCount.hidden = promptSession.kind !== "find";
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

    if (element instanceof HTMLInputElement) {
      return false;
    }

    if (
      isEditableTarget(element) ||
      element.closest("[contenteditable='true'], [contenteditable='']")
    ) {
      return false;
    }

    if (typeof element.checkVisibility === "function" && !element.checkVisibility()) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return (
      (style.display === "contents" || style.display !== "none") &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      Number.parseFloat(style.opacity) !== 0
    );
  };

  const collectFindMatches = (query: string): FindMatch[] => {
    const parsedQuery = query.replace(/\u00a0/g, " ");
    if (!parsedQuery || !document.body) {
      return [];
    }

    const regex = new RegExp(escapeRegex(parsedQuery), hasUpperCase(parsedQuery) ? "g" : "gi");

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const matches: FindMatch[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode instanceof Text) {
        const parentElement = currentNode.parentElement;

        if (isFindableTextContainer(parentElement)) {
          const text = currentNode.textContent ?? "";
          let match = regex.exec(text);

          while (match) {
            if (!match[0]) {
              break;
            }

            const range = document.createRange();
            range.setStart(currentNode, match.index);
            range.setEnd(currentNode, match.index + match[0].length);

            if (range.getClientRects().length > 0) {
              matches.push({
                range,
                element: parentElement
              });
            }

            match = regex.exec(text);
          }

          regex.lastIndex = 0;
        }
      }

      currentNode = walker.nextNode();
    }

    return matches;
  };

  const resolveActiveFindMatchIndex = (matches: FindMatch[]): number => {
    if (matches.length === 0) {
      return -1;
    }

    const anchorRange = findSessionAnchorRange;
    if (!anchorRange) {
      return 0;
    }

    const nextMatchIndex = matches.findIndex((match) => {
      return anchorRange.compareBoundaryPoints(Range.START_TO_START, match.range) <= 0;
    });

    return nextMatchIndex >= 0 ? nextMatchIndex : 0;
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

    updateFindUICounts();
    applyFindHighlights();
  };

  const setFindQuery = (query: string): void => {
    if (findQuery.length === 0 && query.length > 0) {
      findSessionAnchorRange = getSelectionAnchorRange() ?? createBodyStartRange();
    }

    findQuery = query;
    findMatches = collectFindMatches(query);
    currentFindMatchIndex = resolveActiveFindMatchIndex(findMatches);
    updateFindUICounts();
    applyFindHighlights();
  };

  const hideFindBar = (): void => {
    getFindBar()?.setAttribute("data-visible", "false");

    if (!isFindStatusVisible) {
      deactivateSiteKeybindIgnore("find");
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
    if (promptSession.kind === "find") {
      setFindQuery("");
    } else {
      updateFindUICounts();
    }
    syncPromptKind();
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
    findSessionAnchorRange = null;
    promptSession = { kind: "find" };
    deactivateSiteKeybindIgnore("find");
    clearFindHighlights();
    syncPromptKind();
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

    if (promptSession.kind === "bar") {
      const target = promptSession.mode === "new-tab" ? "new-tab" : "current-tab";
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        clearFindSession();
        return false;
      }

      const destination =
        resolveBarNavigationUrl(trimmedQuery) ?? resolveSearchUrl(trimmedQuery, barSearchEngineURL);

      clearFindSession();

      if (target === "new-tab") {
        window.open(destination, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(destination);
      }

      return true;
    }

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

  return {
    ensureFindUI: (): void => {
      ensureFindUIReady();
    },
    openFindPrompt: (): boolean => {
      const ui = ensureFindUIReady();

      if (!ui) {
        return false;
      }

      promptSession = { kind: "find" };
      ui.input.value = findQuery;
      setFindQuery(ui.input.value);
      syncPromptKind();
      ui.bar.setAttribute("data-visible", "true");
      activateSiteKeybindIgnore("find");
      deps.setMode("find");
      ui.input.focus();
      ui.input.select();
      return true;
    },
    openBarPrompt: (
      mode: "current-tab" | "new-tab" | "edit-current-tab",
      initialValue = ""
    ): boolean => {
      const ui = ensureFindUIReady();

      if (!ui) {
        return false;
      }

      promptSession = { kind: "bar", mode };
      isFindStatusVisible = false;
      findMatches = [];
      currentFindMatchIndex = -1;
      clearFindHighlights();
      syncFindStatusVisibility();
      ui.input.value = initialValue;
      syncPromptKind();
      updateFindUICounts();
      ui.bar.setAttribute("data-visible", "true");
      activateSiteKeybindIgnore("find");
      deps.setMode("find");
      ui.input.focus();
      ui.input.select();
      return true;
    },
    getFindQuery: (): string => findQuery,
    setFindQuery: (query: string): void => {
      activateSiteKeybindIgnore("find");
      setFindQuery(query);
    },
    hideFindBar,
    exitFindMode,
    cycleFindMatch,
    setBarSearchEngineURL: (value: string): void => {
      barSearchEngineURL = value || DEFAULT_BAR_SEARCH_ENGINE_URL;
    },
    isFindModeActive: (): boolean => deps.getMode() === "find",
    isFindInputFocused,
    handleFindUIKeydown: (event: KeyboardEvent): boolean => {
      if (!isFindUIElement(event.target) && !isFindInputFocused()) {
        return false;
      }

      if (event.key === "Enter") {
        commitFindQuery();
        return true;
      }

      return false;
    },
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