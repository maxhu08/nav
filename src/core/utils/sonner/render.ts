export const applyToastClasses = (toastEl: HTMLElement): void => {
  const iconContainer = toastEl.querySelector<HTMLElement>("[data-icon]");
  const titleEl = toastEl.querySelector<HTMLElement>("[data-title]");
  const descEl = toastEl.querySelector<HTMLElement>("[data-description]");
  const actionBtn = toastEl.querySelector<HTMLElement>('button[data-toast-action="true"]');
  const accent = "#eab308";

  toastEl.style.background = "linear-gradient(135deg, #0a0a0a, #1c1c1c)";
  toastEl.style.color = "#f5f5f5";
  toastEl.style.border = `2px solid ${accent}`;
  toastEl.style.boxShadow = `0 18px 45px rgba(0, 0, 0, 0.38), 0 0 0 1px ${accent}22 inset`;
  toastEl.style.fontSize = "16px";
  toastEl.style.lineHeight = "24px";

  if (iconContainer) iconContainer.style.color = accent;

  if (titleEl) {
    titleEl.style.color = "#ffffff";
    titleEl.style.fontWeight = "700";
    titleEl.style.letterSpacing = "0.01em";
    titleEl.style.fontSize = "16px";
    titleEl.style.lineHeight = "24px";
  }

  if (descEl) {
    descEl.style.color = "#737373";
    descEl.style.fontSize = "16px";
    descEl.style.lineHeight = "24px";
    descEl.style.minWidth = "0";
    descEl.style.overflow = "hidden";
    descEl.style.textOverflow = "ellipsis";
    descEl.style.whiteSpace = "nowrap";
  }

  if (actionBtn) {
    actionBtn.style.color = accent;
    actionBtn.style.borderColor = `${accent}55`;
    actionBtn.style.background = `${accent}12`;
  }
};