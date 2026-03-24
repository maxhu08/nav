import {
  createHintsController,
  HINT_SELECTABLE_ACTIVATED_EVENT
} from "~/src/core/actions/hints/controller";

const hintsController = createHintsController();

export { HINT_SELECTABLE_ACTIVATED_EVENT };

export const activateHints = hintsController.activateHints;
export const areHintsActive = hintsController.areHintsActive;
export const areHintsPendingSelection = hintsController.areHintsPendingSelection;
export const exitHints = hintsController.exitHints;
export const handleHintsKeydown = hintsController.handleHintsKeydown;
export const setAvoidedAdjacentHintPairs = hintsController.setAvoidedAdjacentHintPairs;
export const setHighlightThumbnails = hintsController.setHighlightThumbnails;
export const setHintCharset = hintsController.setHintCharset;
export const setHintCSS = hintsController.setHintCSS;
export const setMinHintLabelLength = hintsController.setMinHintLabelLength;
export const setReservedHintLabels = hintsController.setReservedHintLabels;
export const setReservedHintPrefixes = hintsController.setReservedHintPrefixes;
export const setShowCapitalizedLetters = hintsController.setShowCapitalizedLetters;