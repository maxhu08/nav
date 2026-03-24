export type RectLike = Pick<DOMRect, "left" | "top" | "right" | "bottom" | "width" | "height">;

export type HintVisibilityContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  isHintable: (element: HTMLElement) => boolean;
  isVisibleHintTarget: (element: HTMLElement) => boolean;
};

export type PointHitTestResult = "reachable" | "occluded" | "popup-occluded" | "missing";

export const ACTIVATABLE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "combobox",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox"
]);

export const INTERACTIVE_ARIA_ATTRIBUTES = [
  "aria-checked",
  "aria-controls",
  "aria-expanded",
  "aria-haspopup",
  "aria-pressed",
  "aria-selected"
] as const;

export const INTERACTIVE_DATA_ATTRIBUTES = ["data-state"] as const;