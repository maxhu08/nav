import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_LABEL_ATTRIBUTE,
  MARKER_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";

const createMarkerElement = (variant = "default"): HTMLDivElement => {
  const marker = document.createElement("div");
  marker.setAttribute(MARKER_ATTRIBUTE, "true");
  marker.setAttribute(MARKER_VARIANT_ATTRIBUTE, variant);
  marker.setAttribute("data-visible", "true");
  return marker;
};

const createMarkerLabelElement = (): HTMLSpanElement => {
  const label = document.createElement("span");
  label.setAttribute(MARKER_LABEL_ATTRIBUTE, "true");
  return label;
};

const createMarkerIconElement = (iconSvg: string): HTMLSpanElement => {
  const icon = document.createElement("span");
  icon.setAttribute(MARKER_ICON_ATTRIBUTE, "true");
  icon.innerHTML = iconSvg;
  return icon;
};

export const createHintMarker = (): HTMLDivElement => createMarkerElement();

export const createHintMarkerWithIcon = (iconSvg: string): HTMLDivElement => {
  const marker = createMarkerElement("with-icon");
  marker.append(createMarkerLabelElement(), createMarkerIconElement(iconSvg));
  return marker;
};