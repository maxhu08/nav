import { initCoreNavigation } from "~/src/core/navigation";
import {
  FILE_COPY_ICON_PATH,
  HINT_ATTACH_ICON_PATH,
  HINT_CANCEL_ICON_PATH,
  HINT_DELETE_ICON_PATH,
  HINT_DISLIKE_ICON_PATH,
  HINT_DOWNLOAD_ICON_PATH,
  HINT_HIDE_ICON_PATH,
  HINT_HOME_ICON_PATH,
  HINT_INPUT_ICON_PATH,
  HINT_LIKE_ICON_PATH,
  HINT_LOGIN_ICON_PATH,
  HINT_MICROPHONE_ICON_PATH,
  HINT_NEXT_ICON_PATH,
  HINT_PREV_ICON_PATH,
  HINT_SAVE_ICON_PATH,
  HINT_SHARE_ICON_PATH,
  HINT_SIDEBAR_ICON_PATH,
  HINT_SUBMIT_ICON_PATH
} from "~/src/lib/inline-icons";

const DOCS_DIRECTIVE_ICON_PATHS: Record<string, string> = {
  input: HINT_INPUT_ICON_PATH,
  attach: HINT_ATTACH_ICON_PATH,
  share: HINT_SHARE_ICON_PATH,
  download: HINT_DOWNLOAD_ICON_PATH,
  login: HINT_LOGIN_ICON_PATH,
  microphone: HINT_MICROPHONE_ICON_PATH,
  delete: HINT_DELETE_ICON_PATH,
  save: HINT_SAVE_ICON_PATH,
  copy: FILE_COPY_ICON_PATH,
  hide: HINT_HIDE_ICON_PATH,
  home: HINT_HOME_ICON_PATH,
  sidebar: HINT_SIDEBAR_ICON_PATH,
  next: HINT_NEXT_ICON_PATH,
  prev: HINT_PREV_ICON_PATH,
  cancel: HINT_CANCEL_ICON_PATH,
  submit: HINT_SUBMIT_ICON_PATH,
  like: HINT_LIKE_ICON_PATH,
  dislike: HINT_DISLIKE_ICON_PATH
};

const SVG_NS = "http://www.w3.org/2000/svg";

const createDirectiveIcon = (pathData: string): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("class", "size-4");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);

  svg.append(path);
  return svg;
};

const renderDirectiveIcons = (): void => {
  document.querySelectorAll<HTMLElement>("[data-directive-icon]").forEach((iconHost) => {
    const iconName = iconHost.dataset.directiveIcon;
    if (!iconName) {
      return;
    }

    const pathData = DOCS_DIRECTIVE_ICON_PATHS[iconName];
    if (!pathData) {
      return;
    }

    iconHost.replaceChildren(createDirectiveIcon(pathData));
  });
};

initCoreNavigation();
renderDirectiveIcons();