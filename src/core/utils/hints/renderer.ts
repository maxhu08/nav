export const createHintOverlay = (overlayId: string, markerAttribute: string): HTMLDivElement => {
  const existing = document.getElementById(overlayId);
  if (existing instanceof HTMLDivElement) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.setAttribute(markerAttribute, "true");
  overlay.setAttribute("aria-hidden", "true");

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.pointerEvents = "none";

  return overlay;
};

export const getDefaultHintMarkerCSS = (
  markerStyleAttribute: string,
  markerVariantStyleAttribute: string,
  letterStyleAttribute: string
): string => {
  const markerSelector = `[${markerStyleAttribute}]`;
  const thumbnailMarkerSelector = `[${markerVariantStyleAttribute}="thumbnail"]`;
  const pendingSelector = `[${letterStyleAttribute}="pending"]`;
  const typedSelector = `[${letterStyleAttribute}="typed"]`;

  return `${markerSelector}{transform:translate(-20%,-20%);transition:none !important;transition-duration:0ms !important;transition-property:none !important;padding:1px 4px;border-radius:3px;background:#eab308;color:#2b1d00;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.08em;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,.28);white-space:nowrap;}${thumbnailMarkerSelector}{transform:translate(0,0);padding:4px 10px;border-radius:6px;font-size:18px;font-weight:800;letter-spacing:.12em;line-height:1.1;box-shadow:0 3px 10px rgba(0,0,0,.4);}${pendingSelector}{color:#000000;}${typedSelector}{color:#ffffff;}`;
};

export const applyHintStyles = (styleId: string, hintCSS: string): void => {
  const existing = document.getElementById(styleId);

  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== hintCSS) {
      existing.textContent = hintCSS;
    }
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = hintCSS;
  document.head.appendChild(style);
};