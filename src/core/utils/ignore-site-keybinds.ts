type SiteKeybindIgnoreOwner = "find" | "hints" | "watch";

const activeOwners = new Set<SiteKeybindIgnoreOwner>();

const suppressSiteKeybind = (event: KeyboardEvent): void => {
  if (activeOwners.size === 0) {
    return;
  }

  event.stopImmediatePropagation();
};

const registerIgnoreListeners = (): void => {
  window.addEventListener("keydown", suppressSiteKeybind, true);
  window.addEventListener("keypress", suppressSiteKeybind, true);
  window.addEventListener("keyup", suppressSiteKeybind, true);
};

const unregisterIgnoreListeners = (): void => {
  window.removeEventListener("keydown", suppressSiteKeybind, true);
  window.removeEventListener("keypress", suppressSiteKeybind, true);
  window.removeEventListener("keyup", suppressSiteKeybind, true);
};

export const activateSiteKeybindIgnore = (owner: SiteKeybindIgnoreOwner): void => {
  const wasInactive = activeOwners.size === 0;
  activeOwners.add(owner);

  if (wasInactive) {
    registerIgnoreListeners();
  }
};

export const deactivateSiteKeybindIgnore = (owner: SiteKeybindIgnoreOwner): void => {
  activeOwners.delete(owner);

  if (activeOwners.size === 0) {
    unregisterIgnoreListeners();
  }
};

export const resetSiteKeybindIgnoreForTests = (): void => {
  activeOwners.clear();
  unregisterIgnoreListeners();
};