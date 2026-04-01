import type {
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";

export type HintActionMode =
  | "current-tab"
  | "new-tab"
  | "yank-link-url"
  | "yank-image"
  | "yank-image-url";

export type HintTargetDirectiveMatch = {
  directive: ReservedHintDirective;
  label: string;
};

export type HintTarget = {
  element: HTMLElement;
  label: string;
  marker: HTMLDivElement;
  rect: DOMRect;
  imageUrl: string | null;
  linkUrl: string | null;
  directiveMatch?: HintTargetDirectiveMatch;
};

export type HintDirectiveLabelMap = ReservedHintLabels;