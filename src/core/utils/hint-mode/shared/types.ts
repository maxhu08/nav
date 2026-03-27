export type HintActionMode =
  | "current-tab"
  | "new-tab"
  | "yank-link-url"
  | "yank-image"
  | "yank-image-url";

export type HintTarget = {
  element: HTMLElement;
  label: string;
  marker: HTMLDivElement;
  rect: DOMRect;
  imageUrl: string | null;
  linkUrl: string | null;
};