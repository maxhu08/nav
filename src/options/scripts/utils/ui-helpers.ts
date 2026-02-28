export const getButton = (id: string): HTMLButtonElement => {
  return document.getElementById(`${id}-button`) as HTMLButtonElement;
};

export const getContainerAndTextarea = (id: string): [HTMLDivElement, HTMLTextAreaElement] => {
  const container = document.getElementById(`${id}-container`) as HTMLDivElement;
  const textarea = document.getElementById(`${id}-textarea`) as HTMLTextAreaElement;

  return [container, textarea];
};
