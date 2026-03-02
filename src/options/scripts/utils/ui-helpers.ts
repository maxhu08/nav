import { OPTIONS_SECTION_EXPANDED_EVENT } from "~/src/options/scripts/utils/collapse-option";

export const getButton = (id: string): HTMLButtonElement => {
  return document.getElementById(`${id}-button`) as HTMLButtonElement;
};

export const getElement = <T extends HTMLElement>(id: string): T => {
  return document.getElementById(id) as T;
};

export const getContainerAndInput = (id: string): [HTMLDivElement, HTMLInputElement] => {
  const container = document.getElementById(`${id}-container`) as HTMLDivElement;
  const input = document.getElementById(`${id}-input`) as HTMLInputElement;

  return [container, input];
};

export const getContainerAndTextarea = (id: string): [HTMLDivElement, HTMLTextAreaElement] => {
  const container = document.getElementById(`${id}-container`) as HTMLDivElement;
  const textarea = document.getElementById(`${id}-textarea`) as HTMLTextAreaElement;

  return [container, textarea];
};

export const lockTextareaContainerHeight = (
  container: HTMLDivElement,
  textarea: HTMLTextAreaElement
): void => {
  const syncHeight = () => {
    if (!container.isConnected || !textarea.isConnected) {
      return;
    }

    if (textarea.offsetHeight === 0) {
      container.style.removeProperty("height");
      return;
    }

    const styles = window.getComputedStyle(container);
    const verticalInsets =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom) +
      Number.parseFloat(styles.borderTopWidth) +
      Number.parseFloat(styles.borderBottomWidth);

    container.style.height = `${textarea.offsetHeight + verticalInsets}px`;
  };

  syncHeight();
  window.addEventListener("resize", syncHeight);
  window.addEventListener(OPTIONS_SECTION_EXPANDED_EVENT, (event) => {
    const expandedSectionId = (event as CustomEvent<{ sectionId?: string }>).detail?.sectionId;
    if (!expandedSectionId) {
      return;
    }

    const expandedSection = document.getElementById(expandedSectionId);
    if (!expandedSection?.contains(container)) {
      return;
    }

    window.requestAnimationFrame(syncHeight);
  });
};
