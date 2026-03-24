import { renderFindStyles, type FindStyleRenderParams } from "~/src/core/styles/render-find-styles";
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

const getStyleById = (root: ShadowRoot | HTMLElement, styleId: string): HTMLStyleElement | null => {
  const existingStyle =
    root instanceof ShadowRoot
      ? root.getElementById(styleId)
      : (Array.from(root.children).find(
          (child) => child instanceof HTMLStyleElement && child.id === styleId
        ) ?? null);

  return existingStyle instanceof HTMLStyleElement ? existingStyle : null;
};

const upsertStyle = (root: ShadowRoot | HTMLElement, styleId: string, css: string): void => {
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

const getDocumentStyleRoot = (): HTMLElement => {
  return document.head ?? document.documentElement;
};

export const injectStyles = (params: InjectStylesParams): void => {
  upsertStyle(getDocumentStyleRoot(), params.focusStyleId, renderFocusStyles(params.focus));

  if (params.findStyleId && params.find && params.findRoot) {
    upsertStyle(params.findRoot, params.findStyleId, renderFindStyles(params.find));
  }
};