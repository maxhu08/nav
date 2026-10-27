import type { Config } from "~/src/utils/config";
import { enableEditorTabInsertion } from "~/src/options/scripts/utils/editor-tabs";
import { createCustomCSSHighlight } from "~/src/options/scripts/utils/hints-custom-css-highlight";
import { getElement, getContainerAndTextarea } from "~/src/options/scripts/utils/ui-helpers";

const createPromptStylingControls = (mode: "bar" | "find") => {
  const buttons = (["default", "custom"] as const).map((styling) => ({
    styling,
    element: getElement<HTMLButtonElement>(`${mode}-styling-${styling}-button`)
  }));
  const section = getElement<HTMLDivElement>(`${mode}-custom-css-section`);
  const [container, textarea] = getContainerAndTextarea(`${mode}-custom-css`);
  const highlight = createCustomCSSHighlight(
    textarea,
    getElement<HTMLPreElement>(`${mode}-custom-css-highlight`)
  );

  const sync = (styling: Config["find"]["styling"]): void => {
    buttons.forEach((button) => {
      const selected = button.styling === styling;
      button.element.setAttribute("aria-pressed", String(selected));
      button.element.classList.toggle("bg-yellow-500", selected);
      button.element.classList.toggle("hover:bg-yellow-600", selected);
      button.element.classList.toggle("bg-neutral-800", !selected);
      button.element.classList.toggle("hover:bg-neutral-700", !selected);
    });
    section.classList.toggle("hidden", styling !== "custom");
    section.classList.toggle("grid", styling === "custom");
    highlight.refresh();
  };

  return {
    fill: (config: Config["find"]): void => {
      textarea.value = config.customCSS;
      sync(config.styling);
    },
    save: (config: Config["find"]): void => {
      config.styling =
        buttons[1]!.element.getAttribute("aria-pressed") === "true" ? "custom" : "default";
      config.customCSS = textarea.value;
    },
    init: (): void => {
      highlight.init();
      enableEditorTabInsertion(textarea);
      buttons.forEach((button) => {
        button.element.addEventListener("click", () => sync(button.styling));
      });
      textarea.addEventListener("focus", () =>
        container.classList.replace("border-transparent", "border-sky-500")
      );
      textarea.addEventListener("blur", () =>
        container.classList.replace("border-sky-500", "border-transparent")
      );
    }
  };
};

export const barStylingControls = createPromptStylingControls("bar");
export const findStylingControls = createPromptStylingControls("find");