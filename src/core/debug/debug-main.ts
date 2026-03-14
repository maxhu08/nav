import {
  NAV_DEBUG_HINT_TARGET_REQUEST_EVENT,
  NAV_DEBUG_HINT_TARGET_RESPONSE_EVENT
} from "~/src/core/debug/events";
import { installNavDebugApi } from "~/src/core/debug/nav-debug";

type NavDebugApi = {
  hintTarget: (selector: string) => Promise<unknown>;
};

declare global {
  interface Window {
    navDebug?: NavDebugApi;
  }
}

const requestDebug = (requestEventName: string, responseEventName: string, selector: string) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve) => {
    const onResponse = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      if (event.detail?.requestId !== requestId) {
        return;
      }

      window.removeEventListener(responseEventName, onResponse);
      resolve(event.detail.result ?? null);
    };

    window.addEventListener(responseEventName, onResponse);
    window.dispatchEvent(
      new CustomEvent(requestEventName, {
        detail: {
          requestId,
          selector
        }
      })
    );

    setTimeout(() => {
      window.removeEventListener(responseEventName, onResponse);
      resolve({ timeout: true });
    }, 1200);
  });
};

installNavDebugApi();

window.navDebug = {
  hintTarget: (selector: string) =>
    requestDebug(
      NAV_DEBUG_HINT_TARGET_REQUEST_EVENT,
      NAV_DEBUG_HINT_TARGET_RESPONSE_EVENT,
      selector
    )
};

export {};