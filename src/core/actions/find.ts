type EnableFindModeDeps = {
  getFindBar: () => HTMLDivElement | null;
  getFindInput: () => HTMLInputElement | null;
  getFindQuery: () => string;
  setFindQuery: (query: string) => void;
  onEnable?: () => void;
};

export const createEnableFindModeAction = (deps: EnableFindModeDeps): (() => boolean) => {
  return () => {
    const bar = deps.getFindBar();
    const input = deps.getFindInput();

    if (!bar || !input) {
      return false;
    }

    input.value = deps.getFindQuery();
    deps.setFindQuery(input.value);
    bar.setAttribute("data-visible", "true");
    input.focus();
    input.select();
    deps.onEnable?.();
    return true;
  };
};