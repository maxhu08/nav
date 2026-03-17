export type WatchControllerDeps = {
  isWatchMode: () => boolean;
  setMode: (mode: "normal" | "watch") => void;
  getActionSequence: (
    actionName:
      | "toggle-fullscreen"
      | "toggle-play-pause"
      | "toggle-loop"
      | "toggle-mute"
      | "toggle-captions",
    fallback: string
  ) => string;
};

export type WatchActionTileOptions = {
  iconPath: string;
  sequence: string;
  compact?: boolean;
};

export type SiteToggleControlKind = "fullscreen" | "mute" | "captions" | "loop";

export const MARKER_STYLE_ATTRIBUTE = "data-nav-hint-marker";
export const MARKER_VARIANT_STYLE_ATTRIBUTE = "data-nav-hint-marker-variant";
export const LETTER_STYLE_ATTRIBUTE = "data-nav-hint-marker-letter";

export const WATCH_OVERLAY_GAP_PX = 12;
export const WATCH_LARGE_TILE_SIZE_PX = 88;
export const WATCH_SMALL_TILE_HEIGHT_PX = 48;
export const WATCH_TILE_BORDER_RADIUS_PX = 12;
export const WATCH_COMPACT_TILE_BORDER_RADIUS_PX = 8;
export const WATCH_LARGE_ICON_SIZE_PX = 34;
export const WATCH_SMALL_ICON_SIZE_PX = 22;
export const WATCH_LABEL_FONT_SIZE_PX = 15;
export const WATCH_TILE_FONT_WEIGHT = "800";

export const isVideoVisible = (video: HTMLVideoElement): boolean => {
  const bounds = video.getBoundingClientRect();

  if (bounds.width < 1 || bounds.height < 1) {
    return false;
  }

  if (
    bounds.bottom < 0 ||
    bounds.right < 0 ||
    bounds.top > window.innerHeight ||
    bounds.left > window.innerWidth
  ) {
    return false;
  }

  const styles = window.getComputedStyle(video);
  return styles.display !== "none" && styles.visibility !== "hidden" && styles.opacity !== "0";
};

export const getVideoElementsFromRoot = (root: ParentNode): HTMLVideoElement[] => {
  const videos = new Set<HTMLVideoElement>();
  const visitedRoots = new Set<ParentNode>();

  const visitRoot = (currentRoot: ParentNode): void => {
    if (visitedRoots.has(currentRoot)) {
      return;
    }
    visitedRoots.add(currentRoot);

    const walker = document.createTreeWalker(currentRoot, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.nextNode();

    while (node) {
      if (node instanceof HTMLVideoElement) {
        videos.add(node);
      }

      if (node instanceof HTMLElement && node.shadowRoot) {
        visitRoot(node.shadowRoot);
      }

      node = walker.nextNode();
    }
  };

  visitRoot(root);

  return Array.from(videos);
};