// @ts-nocheck
// based off https://github.com/JeanxPereira/sonner-js/blob/main/sonner-js/sonner.js

import { getExtensionNamespace } from "~/src/utils/extension-id";
import {
  sendToastProxyMessage,
  subscribeToToastProxyMessages
} from "~/src/core/utils/runtime-bridge";
import { getToastAsset } from "~/src/core/utils/sonner/assets";
import { applyToastClasses } from "~/src/core/utils/sonner/render";
import { createToastStyleElement } from "~/src/core/utils/sonner/style";

const VIEWPORT_OFFSET = "32px";
const VISIBLE_TOASTS_AMOUNT = 3;
const GAP = 14;
const TOAST_LIFETIME = 4000;
const TIME_BEFORE_UNMOUNT = 200;
const TOAST_WIDTH = 300;
const DEFAULT_POSITION = "bottom-right";
const NAV_NAMESPACE_PREFIX = `nav-${getExtensionNamespace()}-`;
const TOASTER_WRAPPER_ID = `${NAV_NAMESPACE_PREFIX}toaster-wrapper`;
const TOASTER_LIST_ID = `${NAV_NAMESPACE_PREFIX}toaster-list`;
const TOAST_CLASS = `${NAV_NAMESPACE_PREFIX}toast`;
const STYLE_ID = `${NAV_NAMESPACE_PREFIX}toaster-style`;
const TOAST_PROXY_LISTENER_FLAG = `${NAV_NAMESPACE_PREFIX}toast-proxy-listener`;

const __actionHandlers = new Map();

export const WINDOW_TOAST_KEY = `${NAV_NAMESPACE_PREFIX}toast`;

export function getToastApi() {
  return window[WINDOW_TOAST_KEY];
}

function getWrapper() {
  return document.getElementById(TOASTER_WRAPPER_ID);
}

export function ensureToastWrapper() {
  const root = document.documentElement ?? document.body;
  if (!root) {
    return;
  }

  ensureToastStyle();

  const wrapper = getWrapper() ?? document.createElement("div");
  if (!wrapper.id) {
    wrapper.id = TOASTER_WRAPPER_ID;
  }

  if (!wrapper.getAttribute("data-rich-colors")) {
    wrapper.setAttribute("data-rich-colors", "true");
  }
  if (!wrapper.getAttribute("data-expand")) {
    wrapper.setAttribute("data-expand", "false");
  }
  if (!wrapper.getAttribute("data-position")) {
    wrapper.setAttribute("data-position", "bottom-right");
  }

  wrapper.style.setProperty("position", "fixed", "important");
  wrapper.style.setProperty("inset", "0", "important");
  wrapper.style.setProperty("width", "100vw", "important");
  wrapper.style.setProperty("height", "100vh", "important");
  wrapper.style.setProperty("pointer-events", "none", "important");
  wrapper.style.setProperty("z-index", "2147483647", "important");
  wrapper.style.setProperty("margin", "0", "important");
  wrapper.style.setProperty("padding", "0", "important");
  wrapper.style.setProperty("transform", "none", "important");
  wrapper.style.setProperty("isolation", "isolate", "important");

  if (wrapper.parentElement !== root) {
    root.appendChild(wrapper);
  }
}

function getToasterList() {
  return document.getElementById(TOASTER_LIST_ID);
}

function ensureToastStyle() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  style.id = STYLE_ID;

  const parent = document.head ?? document.documentElement;

  if (!parent) {
    return;
  }

  parent.appendChild(style);
}

function isAllowedType(type) {
  return type === "success" || type === "info" || type === "warning" || type === "error";
}

function shouldProxyToastToTop(action) {
  if (action) {
    return false;
  }

  try {
    return window.top !== window;
  } catch {
    return false;
  }
}

function tryProxyToastToTop(content, { description = "", type } = {}) {
  const toastType = isAllowedType(type) ? type : "info";
  return sendToastProxyMessage({
    content,
    description,
    toastType
  });
}

function basicToast(content, { description = "", type, action } = {}) {
  if (shouldProxyToastToTop(action) && tryProxyToastToTop(content, { description, type })) {
    return null;
  }

  const wrapper = getWrapper();

  if (!wrapper) throw new Error("No wrapper element found, please follow documentation");
  if (!getToasterList()) renderToaster();

  updatePosition();
  updateRichColors();

  const t = isAllowedType(type) ? type : "info";
  const { toast: toastEl } = createToast(content, { description, type: t, action });

  return toastEl;
}

function renderToaster() {
  const el = getWrapper();
  const ol = document.createElement("ol");

  el.append(ol);

  const [y, x] = getPositionAttributes(el, DEFAULT_POSITION);
  const richColors = el.getAttribute("data-rich-colors") === "true";
  const expand = el.getAttribute("data-expand") === "true";
  const position = el.getAttribute("data-position") || DEFAULT_POSITION;

  ol.outerHTML = `
    <ol
      data-sonner-toaster="true"
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notifications"
      data-theme="light"
      data-x-position="${x}"
      data-y-position="${y}"
      ${richColors ? 'data-rich-colors="true"' : ""}
      ${expand ? 'data-expand="true"' : ""}
      data-position="${position}"
      id="${TOASTER_LIST_ID}"
      style="--front-toast-height: 0px; --offset: ${VIEWPORT_OFFSET}; --width: ${TOAST_WIDTH}px; --gap: ${GAP}px; ${getPositionStyles(
        y,
        x
      )}">
    </ol>`;

  registerMouseOver();
  registerDelegatedClicks();
}

function getPositionStyles(y, x) {
  let styles = "";

  if (y === "top") styles += `top: ${VIEWPORT_OFFSET};`;
  else if (y === "bottom") styles += `bottom: ${VIEWPORT_OFFSET};`;

  if (x === "left") styles += `left: ${VIEWPORT_OFFSET};`;
  else if (x === "center") styles += `left: 50%; transform: translateX(-50%);`;
  else if (x === "right") styles += `right: ${VIEWPORT_OFFSET};`;

  return styles;
}

function updatePosition() {
  const list = getToasterList();
  const [y, x] = getPositionAttributes(list.parentElement, DEFAULT_POSITION);

  if (x !== list.getAttribute("data-x-position") || y !== list.getAttribute("data-y-position")) {
    updateElementAttributes(list, { "data-x-position": x, "data-y-position": y });
    Array.from(list.children).forEach((el) =>
      updateElementAttributes(el, { "data-x-position": x, "data-y-position": y })
    );
  }
}

function updateRichColors() {
  const list = getToasterList();
  const richColors = list.parentElement.getAttribute("data-rich-colors") || "";

  if (list.getAttribute("data-rich-colors") !== richColors)
    list.setAttribute("data-rich-colors", richColors);
}

function registerMouseOver() {
  const ol = getToasterList();
  const expandAlways = ol.parentElement.getAttribute("data-expand") === "true";

  if (expandAlways) {
    Array.from(ol.children).forEach((el) => el.setAttribute("data-expanded", "true"));
    return;
  }

  ol.addEventListener("mouseenter", () => {
    Array.from(ol.children).forEach((el) => {
      if (el.getAttribute("data-expanded") === "true") return;
      el.setAttribute("data-expanded", "true");
      clearRemoveTimeout(el);
    });
  });

  ol.addEventListener("mouseleave", () => {
    Array.from(ol.children).forEach((el) => {
      if (el.getAttribute("data-expanded") === "false") return;
      el.setAttribute("data-expanded", "false");
      registerRemoveTimeout(el);
    });
  });
}

function registerDelegatedClicks() {
  const ol = getToasterList();

  if (!ol) return;
  if (ol.getAttribute("data-delegated-clicks") === "true") return;

  ol.setAttribute("data-delegated-clicks", "true");

  ol.addEventListener("click", (e) => {
    const actionBtn =
      e.target && e.target.closest && e.target.closest('button[data-toast-action="true"]');

    if (actionBtn) {
      const actionId = actionBtn.getAttribute("data-action-id");
      const fn = actionId ? __actionHandlers.get(actionId) : null;

      if (typeof fn === "function") fn();

      const toastEl = actionBtn.closest(`.${TOAST_CLASS}`);
      if (toastEl) removeElement(toastEl);
      return;
    }

    const toastEl = e.target && e.target.closest && e.target.closest(`.${TOAST_CLASS}`);
    if (toastEl) removeElement(toastEl);
  });
}

function createToast(message, { description, type, action } = {}) {
  const list = getToasterList();
  const expandAlways = list.parentElement.getAttribute("data-expand") === "true";
  const toastPosition = list.parentElement.getAttribute("data-position") || DEFAULT_POSITION;

  const { toast: toastEl, id } = renderToast(list, message, {
    description,
    type,
    action,
    position: toastPosition
  });

  setTimeout(() => {
    if (list.children.length > 0) {
      const el = list.children[0];
      const height = el.getBoundingClientRect().height;

      el.setAttribute("data-mounted", "true");
      el.setAttribute("data-initial-height", `${height}`);
      el.style.setProperty("--initial-height", `${height}px`);
      list.style.setProperty("--front-toast-height", `${height}px`);

      if (expandAlways) el.setAttribute("data-expanded", "true");

      refreshProperties();
      registerRemoveTimeout(el);
    }
  }, 16);

  return { toast: toastEl, id };
}

function renderToast(list, content, { description, type, action, position } = {}) {
  const toastEl = document.createElement("li");
  const id = genid();
  const count = list.children.length;
  const t = isAllowedType(type) ? type : "info";
  const asset = getToastAsset(t) || "";
  const actionData = action ? registerAction(action, id) : null;
  const actionHtml = actionData ? createActionButton(actionData) : "";

  toastEl.innerHTML = `
    ${asset ? `<div data-icon="" aria-hidden="true">${asset}</div>` : ""}
    <div data-content="">
      <div data-title="">${content}</div>
      ${description ? `<div data-description="">${description}</div>` : ""}
    </div>
    ${actionHtml}`;

  toastEl.classList.add(TOAST_CLASS);

  updateElementAttributes(toastEl, {
    "data-id": id,
    "data-type": t,
    "data-position": position || "bottom-right",
    "data-removed": "false",
    "data-mounted": "false",
    "data-front": "true",
    "data-expanded": "false",
    "data-index": "0",
    "data-y-position":
      list.getAttribute("data-y-position") || (position || "bottom-right").split("-")[0],
    "data-x-position":
      list.getAttribute("data-x-position") || (position || "bottom-right").split("-")[1],
    role: t === "error" || t === "warning" ? "alert" : "status",
    "aria-live": t === "error" || t === "warning" ? "assertive" : "polite",
    "aria-atomic": "true",
    style: `--index: 0; --toasts-before: 0; --z-index: ${count}; --offset: 0px; --initial-height: 0px; cursor: pointer;`
  });

  const actionBtn = toastEl.querySelector('button[data-toast-action="true"]');
  if (actionBtn && !actionBtn.getAttribute("aria-label")) {
    const actionText = actionBtn.textContent?.trim();
    actionBtn.setAttribute(
      "aria-label",
      actionText && actionText.length > 0 ? actionText : "Toast action"
    );
  }

  list.prepend(toastEl);
  applyToastClasses(toastEl, t);

  return { toast: toastEl, id };
}

const style = createToastStyleElement(TOASTER_WRAPPER_ID, TOASTER_LIST_ID, TOAST_CLASS);

function refreshProperties() {
  const list = getToasterList();
  let heightsBefore = 0;
  let removed = 0;

  Array.from(list.children).forEach((el, i) => {
    if (el.getAttribute("data-removed") === "true") {
      removed++;
      return;
    }
    const idx = i - removed;
    updateElementAttributes(el, {
      "data-index": `${idx}`,
      "data-front": idx === 0 ? "true" : "false",
      "data-visible": idx < VISIBLE_TOASTS_AMOUNT ? "true" : "false"
    });
    el.style.setProperty("--index", `${idx}`);
    el.style.setProperty("--toasts-before", `${idx}`);
    el.style.setProperty("--offset", `${GAP * idx + heightsBefore}px`);
    el.style.setProperty("--z-index", `${list.children.length - i}`);
    heightsBefore += Number(el.getAttribute("data-initial-height"));
  });
}

function registerRemoveTimeout(el) {
  const tid = setTimeout(() => removeElement(el), TOAST_LIFETIME);
  el.setAttribute("data-remove-tid", `${tid}`);
}

function clearRemoveTimeout(el) {
  const tid = el.getAttribute("data-remove-tid");
  if (tid != null) clearTimeout(+tid);
}

function removeElement(el) {
  el.setAttribute("data-removed", "true");

  const actionBtn = el.querySelector && el.querySelector('button[data-toast-action="true"]');
  const actionId = actionBtn ? actionBtn.getAttribute("data-action-id") : null;

  if (actionId) __actionHandlers.delete(actionId);

  refreshProperties();

  const tid = setTimeout(() => {
    if (el.parentElement) el.parentElement.removeChild(el);
  }, TIME_BEFORE_UNMOUNT);

  el.setAttribute("data-unmount-tid", `${tid}`);
}

function getPositionAttributes(element, defaultPosition) {
  return (element.getAttribute("data-position") || defaultPosition).split("-");
}

function updateElementAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function genid() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

const toast = {
  success: (message, options = {}) => basicToast(message, { ...options, type: "success" }),
  info: (message, options = {}) => basicToast(message, { ...options, type: "info" }),
  warning: (message, options = {}) => basicToast(message, { ...options, type: "warning" }),
  error: (message, options = {}) => basicToast(message, { ...options, type: "error" })
};

function registerToastProxyListener() {
  try {
    if (window.top !== window) {
      return;
    }
  } catch {
    return;
  }

  if (window[TOAST_PROXY_LISTENER_FLAG]) {
    return;
  }
  window[TOAST_PROXY_LISTENER_FLAG] = true;

  subscribeToToastProxyMessages((payload) => {
    ensureToastWrapper();
    basicToast(payload.content, {
      description: typeof payload.description === "string" ? payload.description : "",
      type: payload.toastType
    });
  });
}

window[WINDOW_TOAST_KEY] = toast;
if (document) {
  registerToastProxyListener();
  ensureToastWrapper();
}