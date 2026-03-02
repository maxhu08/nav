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
};
