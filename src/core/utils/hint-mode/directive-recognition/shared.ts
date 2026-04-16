export type DirectiveScorer = (element: HTMLElement) => number;

const EDITABLE_INPUT_TYPES = new Set([
  "",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url"
]);

export const getPatternScore = (value: string | null, pattern: RegExp, weight: number): number => {
  return typeof value === "string" && pattern.test(value) ? weight : 0;
};

export const getElementTextValues = (element: HTMLElement, attributes: string[]): string[] => {
  return attributes
    .map((attribute) => element.getAttribute(attribute))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
};

export const getJoinedElementText = (values: Array<string | null | undefined>): string => {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .trim();
};

const getAriaLabelledByText = (element: HTMLElement): string => {
  const labelledBy = element.getAttribute("aria-labelledby")?.trim();
  if (!labelledBy) {
    return "";
  }

  return labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
    .filter((value) => value.length > 0)
    .join(" ");
};

export const getAncestorDescriptorText = (element: HTMLElement, depthLimit = 3): string => {
  const values: string[] = [];
  let current = element.parentElement;
  let depth = 0;

  while (current && depth < depthLimit) {
    values.push(current.tagName.toLowerCase(), current.id, current.className);
    current = current.parentElement;
    depth += 1;
  }

  return getJoinedElementText(values);
};

export const isEditableInputCandidate = (element: HTMLElement): boolean => {
  if (element instanceof HTMLTextAreaElement) {
    return !(element.disabled || element.readOnly);
  }

  if (element instanceof HTMLInputElement) {
    return (
      !(element.disabled || element.readOnly) &&
      EDITABLE_INPUT_TYPES.has(element.type.toLowerCase())
    );
  }

  const role = element.getAttribute("role")?.toLowerCase();
  return (
    element.isContentEditable || role === "textbox" || role === "searchbox" || role === "combobox"
  );
};

export const isButtonLikeDirectiveCandidate = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase();

  if (tagName === "button" || tagName === "label") {
    return true;
  }

  if (tagName === "input") {
    const type = (element.getAttribute("type") ?? "").toLowerCase();
    return ["button", "submit", "image", "file"].includes(type);
  }

  return role === "button";
};

export const isActionableDirectiveCandidate = (element: HTMLElement): boolean => {
  return (
    isButtonLikeDirectiveCandidate(element) ||
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLAreaElement
  );
};

export const getActionOwnDescriptorText = (element: HTMLElement): string => {
  return getJoinedElementText([
    ...getElementTextValues(element, [
      "aria-label",
      "title",
      "aria-description",
      "data-tooltip",
      "data-testid",
      "id",
      "class",
      "name",
      "role",
      "type",
      "aria-controls",
      "aria-haspopup",
      "alt"
    ]),
    getAriaLabelledByText(element),
    isButtonLikeDirectiveCandidate(element) ? element.textContent : ""
  ]);
};

export const getActionDescriptorText = (element: HTMLElement): string => {
  return getActionOwnDescriptorText(element);
};

export const getAnchorPathScore = (
  element: HTMLElement,
  pattern: RegExp,
  weight: number
): number => {
  if (!(element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement)) {
    return 0;
  }

  try {
    const url = new URL(element.href, window.location.href);
    return pattern.test(url.pathname) ? weight : 0;
  } catch {
    return 0;
  }
};