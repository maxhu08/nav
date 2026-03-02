import { deepMerge } from "~/src/utils/deep-merge";

export type OptionsData = {
  sectionsExpanded: {
    rules: boolean;
    hotkeys: boolean;
    hints: boolean;
  };
  pendingExcludeSiteUrl: string | null;
};

export const defaultOptionsData: OptionsData = {
  sectionsExpanded: {
    rules: true,
    hotkeys: true,
    hints: true
  },
  pendingExcludeSiteUrl: null
};

const mergeOptionsData = (value: unknown): OptionsData => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return structuredClone(defaultOptionsData);
  }

  return deepMerge(structuredClone(defaultOptionsData), value);
};

export const getOptionsData = (): Promise<OptionsData> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["optionsData"], (data) => {
      const optionsData = mergeOptionsData(data.optionsData);

      if (!data.optionsData) {
        chrome.storage.local.set({ optionsData }, () => resolve(optionsData));
        return;
      }

      resolve(optionsData);
    });
  });
};

export const setOptionsData = (optionsData: OptionsData): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ optionsData: mergeOptionsData(optionsData) }, () => resolve());
  });
};

export const updateOptionsData = async (
  updater: (draft: OptionsData) => OptionsData
): Promise<OptionsData> => {
  const nextOptionsData = updater(await getOptionsData());
  const mergedOptionsData = mergeOptionsData(nextOptionsData);

  await setOptionsData(mergedOptionsData);

  return mergedOptionsData;
};
