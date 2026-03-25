export const getTextareaOverlayHTML = (sourceText: string, renderedHtml: string): string => {
  if (sourceText.length === 0) {
    return " ";
  }

  if (sourceText.endsWith("\n")) {
    return `${renderedHtml} `;
  }

  return renderedHtml;
};