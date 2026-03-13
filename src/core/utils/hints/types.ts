import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/hint-recognition";

export type AdjacentHintPairs = Partial<Record<string, Partial<Record<string, true>>>>;

export type ReservedHintLabels = {
  search: string[];
  home: string[];
  sidebar: string[];
  next: string[];
  prev: string[];
  cancel: string[];
  submit: string[];
  like: string[];
  dislike: string[];
};
export type ReservedHintDirective = keyof ReservedHintLabels;

export type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  thumbnailIcon: SVGSVGElement | null;
  label: string;
  directive: ReservedHintDirective | null;
  letters: HTMLSpanElement[];
  visible: boolean;
  renderedTyped: string;
  markerWidth: number;
  markerHeight: number;
  sizeDirty: boolean;
};

export type HintState = {
  active: boolean;
  mode: LinkMode;
  typed: string;
  previousTyped: string;
  markers: HintMarker[];
  visibleMarkers: HintMarker[];
  markerByLabel: Map<string, HintMarker>;
  overlay: HTMLDivElement | null;
  onActivate: ((element: HTMLElement) => void) | null;
  frameHandle: number | null;
  revealedHoverElements: RevealedHintElement[];
};

export type HintLabelPlanSettings = {
  minHintLabelLength: number;
  hintAlphabet: string;
  reservedHintPrefixes: Set<string>;
  avoidedAdjacentHintPairs: AdjacentHintPairs;
};

export type MarkerDomAttributes = {
  markerAttribute: string;
  markerStyleAttribute: string;
  markerVariantStyleAttribute: string;
  letterAttribute: string;
  letterStyleAttribute: string;
};