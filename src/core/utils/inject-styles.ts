import {
  renderFindStyles,
  renderFindHighlightStyles,
  type FindStyleRenderParams
} from "~/src/core/styles/render-find-styles";
import {
  renderFocusStyles,
  type FocusStyleRenderParams
} from "~/src/core/styles/render-focus-styles";

type InjectStylesParams = {
  focusStyleId: string;
  focus: FocusStyleRenderParams;
  findStyleId?: string;
  find?: FindStyleRenderParams;
  findRoot?: ShadowRoot | null;
};

export const getStyleById = (
  root: ShadowRoot | HTMLElement,
  styleId: string
): HTMLStyleElement | null => {
  const existingStyle =
    root instanceof ShadowRoot
      ? root.getElementById(styleId)
      : (Array.from(root.children).find(
          (child) => child instanceof HTMLStyleElement && child.id === styleId
        ) ?? null);

  return existingStyle instanceof HTMLStyleElement ? existingStyle : null;
};

export const upsertStyle = (root: ShadowRoot | HTMLElement, styleId: string, css: string): void => {
  const existingStyle = getStyleById(root, styleId);
  if (existingStyle) {
    existingStyle.textContent = css;
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  root.append(style);
};

export const getDocumentStyleRoot = (): HTMLElement => {
  return document.head ?? document.documentElement;
};

// Resolve colors inside the isolated UI; never copy user CSS into the webpage.
const resolveFindHighlightColors = (
  root: ShadowRoot,
  params: FindStyleRenderParams
): FindStyleRenderParams => {
  const status = root.getElementById(params.findStatusId);
  if (!status) return params;

  const styles = getComputedStyle(status);
  const probe = document.createElement("span");
  status.append(probe);

  const color = (property: string, fallback: string): string => {
    probe.style.removeProperty("color");
    probe.style.setProperty("color", styles.getPropertyValue(property).trim(), "important");
    if (!probe.style.color) return fallback;
    return getComputedStyle(probe).color || fallback;
  };

  const resolved = {
    ...params,
    findHighlightBackgroundColor: color(
      "--nav-find-match-background",
      params.findHighlightBackgroundColor
    ),
    findCurrentHighlightBackgroundColor: color(
      "--nav-find-current-match-background",
      params.findCurrentHighlightBackgroundColor
    ),
    findHighlightTextColor: color("--nav-find-match-color", params.findHighlightTextColor)
  };
  probe.remove();
  return resolved;
};

export const injectStyles = (params: InjectStylesParams): void => {
  upsertStyle(getDocumentStyleRoot(), params.focusStyleId, renderFocusStyles(params.focus));

  if (params.findStyleId && params.find && params.findRoot) {
    const findCss = renderFindStyles(params.find);
    upsertStyle(params.findRoot, params.findStyleId, findCss);
    const highlights = renderFindHighlightStyles(
      resolveFindHighlightColors(params.findRoot, params.find)
    );
    upsertStyle(params.findRoot, `${params.findStyleId}-highlights`, highlights);
    upsertStyle(getDocumentStyleRoot(), `${params.findStyleId}-global`, highlights);
  }
};