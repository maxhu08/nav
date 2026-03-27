import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";

export const showHintToastError = (message: string, description?: string): void => {
  ensureToastWrapper();
  getToastApi()?.error(message, description ? { description } : undefined);
};