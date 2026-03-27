export const collectElements = (
  root: ParentNode,
  selector: string,
  results: HTMLElement[]
): void => {
  for (const element of Array.from(root.querySelectorAll(selector))) {
    if (element instanceof HTMLElement) {
      results.push(element);
    }

    if (element instanceof HTMLElement && element.shadowRoot) {
      collectElements(element.shadowRoot, selector, results);
    }
  }
};