export const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") {
    return false;
  }

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth &&
    rect.top <= window.innerHeight
  );
};