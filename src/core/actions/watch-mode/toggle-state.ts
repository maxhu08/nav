export const getControlPressedState = (control: HTMLElement): boolean | null => {
  const ariaPressed = control.getAttribute("aria-pressed");
  if (ariaPressed === "true") return true;
  if (ariaPressed === "false") return false;

  const ariaChecked = control.getAttribute("aria-checked");
  if (ariaChecked === "true") return true;
  if (ariaChecked === "false") return false;

  return null;
};

export const hasEnabledClassState = (
  control: HTMLElement,
  activePatterns: readonly RegExp[]
): boolean | null => {
  const classes = Array.from(control.classList);
  if (classes.length === 0) {
    return null;
  }

  const classText = classes.join(" ").toLowerCase();
  if (/\b(disabled|inactive|off)\b/.test(classText)) {
    return false;
  }

  if (activePatterns.some((pattern) => pattern.test(classText))) {
    return true;
  }

  return null;
};

export const getCaptionsStateFromLabel = (text: string): boolean | null => {
  if (/\b(turn off|disable|hide)\s+(captions?|subtitles?|cc)\b/.test(text)) {
    return true;
  }
  if (/\b(turn on|enable|show)\s+(captions?|subtitles?|cc)\b/.test(text)) {
    return false;
  }
  return null;
};