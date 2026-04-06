type DocsData = {
  sectionsExpanded: {
    rules: boolean;
    hotkeys: boolean;
    hints: boolean;
    bar: boolean;
    find: boolean;
  };
};

const DOCS_DATA_KEY = "docsData";

const defaultDocsData: DocsData = {
  sectionsExpanded: {
    rules: true,
    hotkeys: true,
    hints: true,
    bar: true,
    find: true
  }
};

const mergeDocsData = (value: unknown): DocsData => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return structuredClone(defaultDocsData);
  }

  return {
    sectionsExpanded: {
      ...defaultDocsData.sectionsExpanded,
      ...(value as Partial<DocsData>).sectionsExpanded
    }
  };
};

const getDocsData = (): Promise<DocsData> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([DOCS_DATA_KEY], (data) => {
      const docsData = mergeDocsData(data[DOCS_DATA_KEY]);

      if (!data[DOCS_DATA_KEY]) {
        chrome.storage.local.set({ [DOCS_DATA_KEY]: docsData }, () => resolve(docsData));
        return;
      }

      resolve(docsData);
    });
  });
};

const updateDocsData = async (updater: (draft: DocsData) => DocsData): Promise<DocsData> => {
  const nextDocsData = updater(await getDocsData());
  const mergedDocsData = mergeDocsData(nextDocsData);

  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [DOCS_DATA_KEY]: mergedDocsData }, () => resolve());
  });

  return mergedDocsData;
};

const collapseSection = (section: HTMLElement): void => {
  section.classList.replace("grid", "hidden");
};

const expandSection = (section: HTMLElement): void => {
  section.classList.replace("hidden", "grid");
};

const bindCollapseButton = (collapseButton: HTMLButtonElement, section: HTMLElement): void => {
  const setExpandedState = (isExpanded: boolean): void => {
    collapseButton.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  };

  collapseButton.addEventListener("click", () => {
    if (section.classList.contains("grid")) {
      collapseButton.children[0].className = "ri-expand-horizontal-s-line";
      collapseSection(section);
      setExpandedState(false);
    } else {
      collapseButton.children[0].className = "ri-collapse-horizontal-line";
      expandSection(section);
      setExpandedState(true);
    }

    void updateDocsData((draft) => {
      const sectionKey = section.id.replace(/-section$/, "") as keyof DocsData["sectionsExpanded"];
      draft.sectionsExpanded[sectionKey] = section.classList.contains("grid");

      return draft;
    });
  });
};

const newCollapseGroup = (buttonId: string, sectionId: string, expanded: boolean): void => {
  const collapseButton = document.getElementById(buttonId) as HTMLButtonElement;
  const section = document.getElementById(sectionId) as HTMLElement;

  collapseButton.setAttribute("aria-controls", sectionId);
  collapseButton.setAttribute("aria-expanded", expanded ? "true" : "false");
  bindCollapseButton(collapseButton, section);

  if (!expanded) {
    collapseButton.click();
  }
};

export const createCollapseGroups = (): Promise<void> => {
  return getDocsData().then((docsData) => {
    newCollapseGroup("rules-collapse-button", "rules-section", docsData.sectionsExpanded.rules);
    newCollapseGroup(
      "hotkeys-collapse-button",
      "hotkeys-section",
      docsData.sectionsExpanded.hotkeys
    );
    newCollapseGroup("hints-collapse-button", "hints-section", docsData.sectionsExpanded.hints);
    newCollapseGroup("bar-collapse-button", "bar-section", docsData.sectionsExpanded.bar);
    newCollapseGroup("find-collapse-button", "find-section", docsData.sectionsExpanded.find);
  });
};