import {
  installScrollTracking,
  scrollHalfPageDown,
  scrollHalfPageUp,
  scrollLeft,
  scrollRight,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp
} from "~/src/core/actions/scroll";
import { followNextPage, followPreviousPage } from "~/src/core/actions/navigation";
import { createEnableFindModeAction } from "~/src/core/actions/find";
import { createTabCommandAction, goHistory } from "~/src/core/actions/tabs";
import { yankCurrentTabUrl, yankCurrentTabUrlClean } from "~/src/core/actions/yank";
import {
  FIND_STYLE_ID,
  FOCUS_INDICATOR_EVENT,
  findStyleParams,
  getFindBar,
  getFindInput
} from "~/src/core/utils/get-ui";
import type { FindStyleRenderParams } from "~/src/core/styles/render-find-styles";
import { createScrollActionSet, type ActionHandler } from "~/src/core/navigation/shared";
import type { ActionName } from "~/src/utils/hotkeys";

type NavigationActionDeps = {
  findMode: {
    getFindQuery: () => string;
    setFindQuery: (value: string) => void;
    cycleFindMatch: (direction: 1 | -1) => boolean;
  };
  hintController: {
    activateMode: (
      mode: "current-tab" | "new-tab" | "yank-link-url" | "yank-image" | "yank-image-url"
    ) => boolean;
  };
  setMode: (mode: "find" | "hint" | "watch" | "normal") => void;
  watchController: {
    toggleVideoControls: () => boolean;
    toggleFullscreen: () => boolean;
    togglePlayPause: () => boolean;
    toggleLoop: () => boolean;
    toggleMute: () => boolean;
    toggleCaptions: () => boolean;
  };
};

type FindModeStylesDeps = {
  syncFindUIStyles: (root: ShadowRoot, styleId: string, params: FindStyleRenderParams) => void;
};

export const createNavigationActions = ({
  findMode,
  hintController,
  setMode,
  watchController
}: NavigationActionDeps): {
  actions: Record<ActionName, ActionHandler>;
  isScrollAction: (actionName: ActionName) => boolean;
  installNavigationScrollTracking: () => void;
} => {
  const enableFindModeAction = createEnableFindModeAction({
    getFindBar,
    getFindInput,
    getFindQuery: findMode.getFindQuery,
    setFindQuery: findMode.setFindQuery,
    onEnable: () => {
      setMode("find");
    }
  });

  const scrollActions = createScrollActionSet();
  const actions: Record<ActionName, ActionHandler> = {
    "watch-mode": watchController.toggleVideoControls,
    "toggle-fullscreen": watchController.toggleFullscreen,
    "toggle-play-pause": watchController.togglePlayPause,
    "toggle-loop": watchController.toggleLoop,
    "toggle-mute": watchController.toggleMute,
    "toggle-captions": watchController.toggleCaptions,
    "find-mode": enableFindModeAction,
    "cycle-match-next": () => findMode.cycleFindMatch(1),
    "cycle-match-prev": () => findMode.cycleFindMatch(-1),
    "history-go-prev": (count = 1) => goHistory(-count),
    "history-go-next": (count = 1) => goHistory(count),
    "follow-prev": followPreviousPage,
    "follow-next": followNextPage,
    "tab-go-prev": createTabCommandAction("tab-go-prev"),
    "tab-go-next": createTabCommandAction("tab-go-next"),
    "duplicate-current-tab": createTabCommandAction("duplicate-current-tab"),
    "duplicate-current-tab-origin": createTabCommandAction("duplicate-current-tab-origin"),
    "move-current-tab-to-new-window": createTabCommandAction("move-current-tab-to-new-window"),
    "close-current-tab": createTabCommandAction("close-current-tab"),
    "create-new-tab": createTabCommandAction("create-new-tab"),
    "reload-current-tab": createTabCommandAction("reload-current-tab"),
    "reload-current-tab-hard": createTabCommandAction("reload-current-tab-hard"),
    "hint-mode-current-tab": () => hintController.activateMode("current-tab"),
    "hint-mode-new-tab": () => hintController.activateMode("new-tab"),
    "yank-link-url": () => hintController.activateMode("yank-link-url"),
    "yank-image": () => hintController.activateMode("yank-image"),
    "yank-image-url": () => hintController.activateMode("yank-image-url"),
    "yank-current-tab-url": yankCurrentTabUrl,
    "yank-current-tab-url-clean": yankCurrentTabUrlClean,
    "scroll-down": scrollDown,
    "scroll-half-page-down": scrollHalfPageDown,
    "scroll-half-page-up": scrollHalfPageUp,
    "scroll-left": scrollLeft,
    "scroll-right": scrollRight,
    "scroll-up": scrollUp,
    "scroll-to-bottom": scrollToBottom,
    "scroll-to-top": scrollToTop
  };

  return {
    actions,
    isScrollAction: (actionName: ActionName): boolean => scrollActions.has(actionName),
    installNavigationScrollTracking: installScrollTracking
  };
};

export const createFindModeStylesBridge = (focusIndicator: FindModeStylesDeps) => {
  return {
    onFocusIndicator: (element: HTMLElement): void => {
      window.dispatchEvent(
        new CustomEvent(FOCUS_INDICATOR_EVENT, {
          detail: { element }
        })
      );
    },
    injectFindUIStyles: (root: ShadowRoot): void => {
      focusIndicator.syncFindUIStyles(root, FIND_STYLE_ID, findStyleParams);
    }
  };
};