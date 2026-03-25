import type { ReservedHintDirective as HintDirective } from "~/src/utils/hint-reserved-label-directives";

export type { HintDirective };

export type ElementFeatureVector = {
  rect: DOMRect | null;
  isSelectable: boolean;
  textContent?: string;
  joinedAttributeTextCache: Map<string, string>;
  closestCache: Map<string, Element | null>;
};

export type ActionDirectiveOptions = {
  allowFormSignals?: boolean;
  relValues?: string[];
  boostDialogContext?: boolean;
  shortTextPatterns?: readonly RegExp[];
  requireButtonLikeControl?: boolean;
};

export type DirectiveScoreContext = {
  attachScore: number;
};

export type DirectiveDefinition = {
  directive: HintDirective;
  threshold: number;
  getScore: (
    element: HTMLElement,
    rect: DOMRect | null,
    features: ElementFeatureVector,
    context: DirectiveScoreContext
  ) => number;
};

export type PreferredDirectiveIndexes = Partial<Record<HintDirective, number>>;
export type DirectiveThresholdMap = Record<HintDirective, number>;

export type DirectiveCandidateScoreMap = Partial<Record<HintDirective, number>>;

export type GeneratedDirectiveCandidates = {
  perElementScores: DirectiveCandidateScoreMap[];
  selectableCount: number;
  onlySelectableIndex: number | null;
};