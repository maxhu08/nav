export const syncFocusStyles = (styleId: string, renderFocusStyles: () => string): void => {
  const style = document.getElementById(styleId);

  if (style instanceof HTMLStyleElement) {
    style.textContent = renderFocusStyles();
  }
};

export const ensureFocusStyles = (styleId: string, renderFocusStyles: () => string): void => {
  const existingStyle = document.getElementById(styleId);

  if (existingStyle instanceof HTMLStyleElement) {
    existingStyle.textContent = renderFocusStyles();
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = renderFocusStyles();

  const styleRoot = document.head ?? document.documentElement;
  styleRoot.append(style);
};
