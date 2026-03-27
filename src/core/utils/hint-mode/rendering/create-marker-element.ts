import {
  MARKER_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";

export const createMarkerElement = (rect: DOMRect): HTMLDivElement => {
  const marker = document.createElement("div");
  marker.setAttribute(MARKER_ATTRIBUTE, "true");
  marker.setAttribute(MARKER_VARIANT_ATTRIBUTE, "default");
  marker.style.left = `${Math.round(rect.left)}px`;
  marker.style.top = `${Math.round(rect.top)}px`;
  marker.setAttribute("data-visible", "true");
  return marker;
};