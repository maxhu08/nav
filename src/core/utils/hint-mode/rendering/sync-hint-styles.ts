import { HINT_STYLE_ID } from "~/src/core/utils/hint-mode/shared/constants";
import { getDocumentStyleRoot } from "~/src/core/utils/hint-mode/rendering/get-document-style-root";
import { renderHintStyles } from "~/src/core/styles/render-hint-styles";
import { upsertStyle } from "~/src/core/utils/inject-styles";

export const syncHintStyles = (css: string): void => {
  upsertStyle(getDocumentStyleRoot(), HINT_STYLE_ID, renderHintStyles(css));
};