import type { ActionName } from "~/src/utils/hotkeys";
import {
  BRIDGE_PORT_NAME,
  type BridgeMessage,
  normalizeToastPayload,
  type ToastPayload
} from "~/src/shared/runtime-bridge";

type FrameActionListener = (actionName: ActionName) => void;
type ToastListener = (payload: ToastPayload) => void;

let port: chrome.runtime.Port | null = null;
let reconnectTimeout: number | null = null;
const frameActionListeners = new Set<FrameActionListener>();
const toastListeners = new Set<ToastListener>();

const clearReconnectTimeout = (): void => {
  if (reconnectTimeout === null) {
    return;
  }

  window.clearTimeout(reconnectTimeout);
  reconnectTimeout = null;
};

const hasActiveListeners = (): boolean => frameActionListeners.size > 0 || toastListeners.size > 0;

const scheduleReconnect = (): void => {
  if (!hasActiveListeners() || reconnectTimeout !== null) {
    return;
  }

  reconnectTimeout = window.setTimeout(() => {
    reconnectTimeout = null;
    ensureRuntimeBridgePort();
  }, 250);
};

const handleBridgeMessage = (message: unknown): void => {
  if (!message || typeof message !== "object") {
    return;
  }

  const data = message as Partial<BridgeMessage>;

  if (data.type === "frame-action" && typeof data.actionName === "string") {
    for (const listener of frameActionListeners) {
      listener(data.actionName as ActionName);
    }

    return;
  }

  if (data.type === "toast-proxy") {
    const payload = normalizeToastPayload(data);
    if (!payload) {
      return;
    }

    for (const listener of toastListeners) {
      listener(payload);
    }
  }
};

const ensureRuntimeBridgePort = (): chrome.runtime.Port | null => {
  if (port) {
    return port;
  }

  clearReconnectTimeout();

  try {
    port = chrome.runtime.connect({ name: BRIDGE_PORT_NAME });
  } catch {
    port = null;
    scheduleReconnect();
    return null;
  }

  port.onMessage.addListener(handleBridgeMessage);
  port.onDisconnect.addListener(() => {
    port = null;
    scheduleReconnect();
  });

  return port;
};

const registerListener = <T>(listeners: Set<T>, listener: T): (() => void) => {
  listeners.add(listener);
  ensureRuntimeBridgePort();

  return () => {
    listeners.delete(listener);
  };
};

export const sendFrameActionMessage = (actionName: ActionName): boolean => {
  const bridgePort = ensureRuntimeBridgePort();
  if (!bridgePort) {
    return false;
  }

  try {
    bridgePort.postMessage({
      type: "frame-action",
      actionName
    } satisfies BridgeMessage);
    return true;
  } catch {
    port = null;
    scheduleReconnect();
    return false;
  }
};

export const subscribeToFrameActionMessages = (listener: FrameActionListener): (() => void) =>
  registerListener(frameActionListeners, listener);

export const sendToastProxyMessage = (payload: ToastPayload): boolean => {
  const bridgePort = ensureRuntimeBridgePort();
  if (!bridgePort) {
    return false;
  }

  try {
    bridgePort.postMessage({
      type: "toast-proxy",
      ...payload
    } satisfies BridgeMessage);
    return true;
  } catch {
    port = null;
    scheduleReconnect();
    return false;
  }
};

export const subscribeToToastProxyMessages = (listener: ToastListener): (() => void) =>
  registerListener(toastListeners, listener);