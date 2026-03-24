import { initCoreNavigation } from "~/src/core/navigation";
import { HINT_DIRECTIVE_ICON_PATHS } from "~/src/lib/hint-directive-icons";

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

    const pathData = HINT_DIRECTIVE_ICON_PATHS[iconName as keyof typeof HINT_DIRECTIVE_ICON_PATHS];
    if (!pathData) {
      return;
    }

    iconHost.replaceChildren(createDirectiveIcon(pathData));
  });
};

initCoreNavigation();
renderDirectiveIcons();