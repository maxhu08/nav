import {
  HINT_CONTAINER_ID,
  LETTER_ATTRIBUTE,
  MARKER_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";

export const renderHintStyles = (customCss: string): string => {
  return `#${HINT_CONTAINER_ID}{position:absolute;inset:0;pointer-events:none}#${HINT_CONTAINER_ID} [${MARKER_ATTRIBUTE}="true"]{position:fixed;z-index:2147483646;pointer-events:none;user-select:none;display:none;white-space:nowrap}#${HINT_CONTAINER_ID} [${MARKER_ATTRIBUTE}="true"][data-visible="true"]{display:block}#${HINT_CONTAINER_ID} [${MARKER_VARIANT_ATTRIBUTE}="watch-action"]{display:inline-flex}#${HINT_CONTAINER_ID} [${LETTER_ATTRIBUTE}="pending"]{color:inherit}#${HINT_CONTAINER_ID} [${LETTER_ATTRIBUTE}="typed"]{color:inherit}${customCss}`;
};