const CONTROL_TEXT_ATTRIBUTES = [
  "aria-label",
  "title",
  "name",
  "id",
  "class",
  "data-testid",
  "data-test-id",
  "data-icon",
  "data-title-no-tooltip",
  "data-tooltip-target-id"
] as const;

export const getControlText = (element: HTMLElement): string => {
  return [
    ...CONTROL_TEXT_ATTRIBUTES.map((attributeName) => element.getAttribute(attributeName)),
    element.textContent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const isLikelyFullscreenControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);

  return (
    className.toLowerCase().includes("fullscreen") ||
    label.includes("fullscreen") ||
    label.includes("full screen") ||
    label.includes("exit fullscreen") ||
    label.includes("exit full screen")
  );
};

export const isLikelyMuteControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);

  return (
    className.toLowerCase().includes("mute") ||
    className.toLowerCase().includes("volume") ||
    label.includes("mute") ||
    label.includes("unmute") ||
    label.includes("volume")
  );
};

export const isLikelyCaptionsControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);

  return (
    className.toLowerCase().includes("caption") ||
    className.toLowerCase().includes("subtitle") ||
    label.includes("caption") ||
    label.includes("subtitles") ||
    label.includes("subtitle") ||
    label.includes("cc")
  );
};

export const isLikelyLoopControl = (element: HTMLElement): boolean => {
  const className = typeof element.className === "string" ? element.className : "";
  const label = getControlText(element);

  return (
    className.toLowerCase().includes("loop") ||
    className.toLowerCase().includes("repeat") ||
    label.includes("loop") ||
    label.includes("repeat")
  );
};