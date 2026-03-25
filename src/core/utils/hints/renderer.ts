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

  return `${markerSelector}{all:initial;transform:translate(0,0);transition:none !important;transition-duration:0ms !important;transition-property:none !important;display:inline-flex !important;flex-direction:row !important;flex-wrap:nowrap !important;align-items:center !important;justify-content:flex-start;gap:3px;max-width:calc(100vw - 16px);box-sizing:border-box;overflow:hidden;padding:2px 5px;border-radius:4px;background:#eab308;color:#2b1d00;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.08em;line-height:1.2;box-shadow:0 1px 3px rgba(0,0,0,.28);white-space:nowrap;white-space-collapse:preserve;text-align:left;direction:ltr;vertical-align:top;}${markerSelector} *,${markerSelector} *::before,${markerSelector} *::after{box-sizing:border-box;}${markerSelector} .nav-hint-marker-label{display:inline-flex !important;flex:0 1 auto;flex-direction:row !important;flex-wrap:nowrap !important;align-items:center !important;gap:0;min-width:0;overflow:hidden;white-space:nowrap;}${markerSelector} .nav-hint-marker-label span{display:inline-block !important;flex:0 0 auto;white-space:pre;}${markerSelector} .nav-hint-marker-icon{display:inline-flex !important;flex:0 0 auto !important;flex-direction:row !important;flex-wrap:nowrap !important;align-items:center !important;justify-content:center !important;width:1.15em;height:1.15em;border-radius:2px;background:rgba(43,29,0,.14);align-self:center;}${markerSelector} .nav-hint-marker-icon svg{display:block;width:.9em;height:.9em;flex:0 0 auto;}${thumbnailMarkerSelector}{transform:translate(0,0);gap:6px;padding:4px 10px;border-radius:6px;font-size:18px;font-weight:800;letter-spacing:.12em;line-height:1.1;box-shadow:0 3px 10px rgba(0,0,0,.4);}${thumbnailMarkerSelector} .nav-hint-marker-icon{width:1.1em;height:1.1em;border-radius:3px;background:rgba(43,29,0,.18);}${pendingSelector}{color:#000000;}${typedSelector}{color:#ffffff;}`;
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

  const parent = document.head ?? document.documentElement;
  if (!parent) {
    return;
  }

  parent.appendChild(style);
};