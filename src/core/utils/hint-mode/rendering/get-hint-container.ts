import { HINT_CONTAINER_ID } from "~/src/core/utils/hint-mode/shared/constants";
import { ensureOverlayRoot } from "~/src/core/utils/get-ui";

export const getHintContainer = (): HTMLDivElement => {
  const existing = document.getElementById(HINT_CONTAINER_ID);
  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const container = document.createElement("div");
  container.id = HINT_CONTAINER_ID;
  container.setAttribute("aria-hidden", "true");
  ensureOverlayRoot().append(container);
  return container;
};