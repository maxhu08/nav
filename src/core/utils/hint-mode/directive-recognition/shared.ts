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