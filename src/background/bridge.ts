import {
  BRIDGE_PORT_NAME,
  type BridgeMessage,
  normalizeToastPayload
} from "~/src/shared/runtime-bridge";
import type { ActionName } from "~/src/utils/hotkeys";
import { isActionName } from "~/src/utils/hotkeys";

const portsByTabId = new Map<number, Set<chrome.runtime.Port>>();

const removeBridgePort = (tabId: number, port: chrome.runtime.Port): void => {
  const ports = portsByTabId.get(tabId);
  if (!ports) {
    return;
  }

  ports.delete(port);
  if (ports.size === 0) {
    portsByTabId.delete(tabId);
  }
};

const getBridgePorts = (tabId: number): Set<chrome.runtime.Port> => {
  const existingPorts = portsByTabId.get(tabId);
  if (existingPorts) {
    return existingPorts;
  }

  const nextPorts = new Set<chrome.runtime.Port>();
  portsByTabId.set(tabId, nextPorts);
  return nextPorts;
};

const relayFrameAction = (
  sourcePort: chrome.runtime.Port,
  ports: Set<chrome.runtime.Port>,
  actionName: ActionName
): void => {
  for (const targetPort of ports) {
    if (targetPort === sourcePort) {
      continue;
    }

    targetPort.postMessage({
      type: "frame-action",
      actionName
    } satisfies BridgeMessage);
  }
};

const relayToastProxy = (
  sourcePort: chrome.runtime.Port,
  ports: Set<chrome.runtime.Port>,
  message: unknown
): void => {
  const payload = normalizeToastPayload(message);
  if (!payload) {
    return;
  }

  for (const targetPort of ports) {
    if (targetPort === sourcePort || targetPort.sender?.frameId !== 0) {
      continue;
    }

    targetPort.postMessage({
      type: "toast-proxy",
      ...payload
    } satisfies BridgeMessage);
  }
};

const handleBridgePortMessage = (
  tabId: number,
  sourcePort: chrome.runtime.Port,
  message: unknown
): void => {
  const ports = portsByTabId.get(tabId);
  if (!ports || !message || typeof message !== "object") {
    return;
  }

  const data = message as Partial<BridgeMessage>;
  if (
    data.type === "frame-action" &&
    typeof data.actionName === "string" &&
    isActionName(data.actionName)
  ) {
    relayFrameAction(sourcePort, ports, data.actionName);
    return;
  }

  if (data.type === "toast-proxy") {
    relayToastProxy(sourcePort, ports, data);
  }
};

export const registerRuntimeBridge = (): void => {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== BRIDGE_PORT_NAME) {
      return;
    }

    const tabId = port.sender?.tab?.id;
    if (typeof tabId !== "number") {
      return;
    }

    getBridgePorts(tabId).add(port);
    port.onDisconnect.addListener(() => {
      removeBridgePort(tabId, port);
    });
    port.onMessage.addListener((message: unknown) => {
      handleBridgePortMessage(tabId, port, message);
    });
  });
};