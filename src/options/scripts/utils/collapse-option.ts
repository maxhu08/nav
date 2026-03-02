import { type OptionsData, getOptionsData, updateOptionsData } from "~/src/utils/options-storage";

const SECTION_EXPANDED_EVENT = "nav:options-section-expanded";

export const collapseOptionSection = (optionSection: HTMLElement): void => {
  optionSection.classList.replace("grid", "hidden");
};

export const expandOptionSection = (optionSection: HTMLElement): void => {
  optionSection.classList.replace("hidden", "grid");
  window.dispatchEvent(
    new CustomEvent(SECTION_EXPANDED_EVENT, {
      detail: {
        sectionId: optionSection.id
      }
    })
  );
};

export const OPTIONS_SECTION_EXPANDED_EVENT = SECTION_EXPANDED_EVENT;

export const bindCollapseOptionButton = (
  collapseButton: HTMLButtonElement,
  optionSection: HTMLElement
): void => {
  collapseButton.addEventListener("click", () => {
    if (optionSection.classList.contains("grid")) {
      collapseButton.children[0].className = "ri-expand-horizontal-s-line";
      collapseOptionSection(optionSection);
    } else {
      collapseButton.children[0].className = "ri-collapse-horizontal-line";
      expandOptionSection(optionSection);
    }

    void updateOptionsData((draft) => {
      const sectionKey = optionSection.id.split("-")[0] as keyof OptionsData["sectionsExpanded"];
      draft.sectionsExpanded[sectionKey] = optionSection.classList.contains("grid");

      return draft;
    });
  });
};

export const newCollapseGroup = (buttonId: string, sectionId: string, expanded: boolean): void => {
  const collapseButton = document.getElementById(buttonId) as HTMLButtonElement;
  const optionSection = document.getElementById(sectionId) as HTMLElement;

  bindCollapseOptionButton(collapseButton, optionSection);
  if (!expanded) collapseButton.click();
};

export const createCollapseGroups = (): Promise<void> => {
  return getOptionsData().then((optionsData) => {
    newCollapseGroup("rules-collapse-button", "rules-section", optionsData.sectionsExpanded.rules);
    newCollapseGroup(
      "hotkeys-collapse-button",
      "hotkeys-section",
      optionsData.sectionsExpanded.hotkeys
    );
    newCollapseGroup("hints-collapse-button", "hints-section", optionsData.sectionsExpanded.hints);
  });
};
