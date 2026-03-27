import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";

export const showHintToastSuccess = (message: string, description?: string): void => {
  ensureToastWrapper();
  getToastApi()?.success(message, description ? { description } : undefined);
};