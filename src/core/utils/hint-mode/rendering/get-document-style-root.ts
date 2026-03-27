export const getDocumentStyleRoot = (): HTMLElement => {
  return document.head ?? document.documentElement;
};