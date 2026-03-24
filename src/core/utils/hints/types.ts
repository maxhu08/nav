import type { LinkMode, RevealedHintElement } from "~/src/core/utils/hints/model";
import type {
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";
export type {
  ReservedHintDirective,
  ReservedHintLabels
} from "~/src/utils/hint-reserved-label-directives";

export type AdjacentHintPairs = Partial<Record<string, Partial<Record<string, true>>>>;

export type HintMarker = {
  element: HTMLElement;
  marker: HTMLSpanElement;
  thumbnailIcon: HTMLSpanElement | null;
  label: string;
  directive: ReservedHintDirective | null;
  labelIcon: HintLabelIcon | null;
  letters: HTMLSpanElement[];
  visible: boolean;
  renderedTyped: string;
  markerWidth: number;
  markerHeight: number;
  sizeDirty: boolean;
};

export type HintLabelIcon = "collapse" | "expand" | "more";

export type HintLabelIndex = {
  getByPrefix: (prefix: string) => HintMarker[];
  hasPrefix: (prefix: string) => boolean;
  getExact: (label: string) => HintMarker | undefined;
};

export type HintState = {
  active: boolean;
  mode: LinkMode;
  typed: string;
  markers: HintMarker[];
  visibleMarkers: HintMarker[];
  labelIndex: HintLabelIndex | null;
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