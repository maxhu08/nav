import type { ActionName } from "~/src/utils/hotkeys";

export type ToastType = "success" | "info" | "warning" | "error";

export type ToastPayload = {
  content: string;
  description?: string;
  toastType?: ToastType;
};

export type BridgeMessage =
  | {
      type: "frame-action";
      actionName: ActionName;
    }
  | ({
      type: "toast-proxy";
    } & ToastPayload);

export const BRIDGE_PORT_NAME = "nav-runtime-bridge";

export const isToastType = (value: unknown): value is ToastType => {
  return value === "success" || value === "info" || value === "warning" || value === "error";
};

export const isBridgeMessage = (value: unknown): value is BridgeMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<BridgeMessage>;
  if (data.type === "frame-action") {
    return typeof data.actionName === "string";
  }

  if (data.type === "toast-proxy") {
    return typeof data.content === "string";
  }

  return false;
};

export const normalizeToastPayload = (value: unknown): ToastPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<ToastPayload>;
  if (typeof data.content !== "string") {
    return null;
  }

  return {
    content: data.content,
    description: typeof data.description === "string" ? data.description : "",
    toastType: isToastType(data.toastType) ? data.toastType : "info"
  };
};