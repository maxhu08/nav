import { renderRulesUrlsValue } from "~/src/options/scripts/utils/rules-highlight";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";

type InputDialogOptions = {
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
};

type ActionDialogOptions = {
  cancelText?: string;
  actionText?: string;
  onAction: () => void | Promise<void>;
};

type TextareaDialogOptions = {
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  note?: string;
};

const OVERLAY_ID = "nav-input-dialog-overlay";
const ACTION_OVERLAY_ID = "nav-action-dialog-overlay";
const TEXTAREA_OVERLAY_ID = "nav-textarea-dialog-overlay";

export const showInputDialog = (
  text: string,
  options: InputDialogOptions = {}
): Promise<string | null> => {
  const existingOverlay = document.getElementById(OVERLAY_ID);
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className =
    "fixed inset-0 z-[1000000000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 160ms ease";

  const dialog = document.createElement("div");
  dialog.className =
    "w-full max-w-xl rounded-md border-2 border-yellow-500 bg-neutral-900 p-4 text-base shadow-2xl";
  dialog.style.opacity = "0";
  dialog.style.transform = "translateY(8px) scale(0.96)";
  dialog.style.transition =
    "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)";

  const textEl = document.createElement("p");
  textEl.className = "mb-3 text-base text-white";
  textEl.textContent = text;

  const inputContainerEl = document.createElement("div");
  inputContainerEl.className =
    "w-full rounded-md border-2 border-transparent bg-neutral-800 p-1 text-base focus-within:border-sky-500";

  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.autocomplete = "off";
  inputEl.className =
    "w-full bg-transparent text-base text-white placeholder-neutral-500 outline-none";
  inputEl.placeholder = options.placeholder ?? "paste here...";
  inputEl.value = options.defaultValue ?? "";
  inputContainerEl.append(inputEl);

  const actions = document.createElement("div");
  actions.className = "mt-4 grid grid-cols-2 gap-2";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "cursor-pointer rounded-md bg-neutral-800 px-3 py-2 text-base text-white transition hover:bg-neutral-700";
  cancelButton.textContent = options.cancelText ?? "cancel";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className =
    "cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-base text-white transition hover:bg-yellow-600";
  confirmButton.textContent = options.confirmText ?? "ok";

  actions.append(cancelButton, confirmButton);
  dialog.append(textEl, inputContainerEl, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    dialog.style.opacity = "1";
    dialog.style.transform = "translateY(0) scale(1)";
  });

  return new Promise((resolve) => {
    let isClosing = false;

    const cleanup = async () => {
      if (isClosing) {
        return;
      }

      isClosing = true;
      document.removeEventListener("keydown", onKeydown);
      overlay.style.opacity = "0";
      dialog.style.opacity = "0";
      dialog.style.transform = "translateY(8px) scale(0.96)";
      await new Promise((done) => setTimeout(done, 160));
      overlay.remove();
    };

    const submit = async () => {
      const value = inputEl.value;
      await cleanup();
      resolve(value);
    };

    const cancel = async () => {
      await cleanup();
      resolve(null);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void cancel();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void submit();
      }
    };

    document.addEventListener("keydown", onKeydown);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        void cancel();
      }
    });
    cancelButton.addEventListener("click", () => {
      void cancel();
    });
    confirmButton.addEventListener("click", () => {
      void submit();
    });

    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 0);
  });
};

export const showActionDialog = (text: string, options: ActionDialogOptions): Promise<boolean> => {
  const existingOverlay = document.getElementById(ACTION_OVERLAY_ID);
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = ACTION_OVERLAY_ID;
  overlay.className =
    "fixed inset-0 z-[1000000000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 160ms ease";

  const dialog = document.createElement("div");
  dialog.className =
    "w-full max-w-xl rounded-md border-2 border-rose-500 bg-neutral-900 p-4 text-base shadow-2xl";
  dialog.style.opacity = "0";
  dialog.style.transform = "translateY(8px) scale(0.96)";
  dialog.style.transition =
    "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)";

  const textEl = document.createElement("p");
  textEl.className = "text-base text-white";
  textEl.textContent = text;

  const actions = document.createElement("div");
  actions.className = "mt-4 grid grid-cols-2 gap-2";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "cursor-pointer rounded-md bg-neutral-800 px-3 py-2 text-base text-white transition hover:bg-neutral-700";
  cancelButton.textContent = options.cancelText ?? "cancel";

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className =
    "cursor-pointer rounded-md bg-rose-500 px-3 py-2 text-base text-white transition hover:bg-rose-600";
  actionButton.textContent = options.actionText ?? "confirm";

  actions.append(cancelButton, actionButton);
  dialog.append(textEl, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    dialog.style.opacity = "1";
    dialog.style.transform = "translateY(0) scale(1)";
  });

  return new Promise((resolve) => {
    let isClosing = false;

    const cleanup = async () => {
      if (isClosing) {
        return;
      }

      isClosing = true;
      document.removeEventListener("keydown", onKeydown);
      overlay.style.opacity = "0";
      dialog.style.opacity = "0";
      dialog.style.transform = "translateY(8px) scale(0.96)";
      await new Promise((done) => setTimeout(done, 160));
      overlay.remove();
    };

    const cancel = async () => {
      await cleanup();
      resolve(false);
    };

    const runAction = async () => {
      await cleanup();
      await options.onAction();
      resolve(true);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void cancel();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void runAction();
      }
    };

    document.addEventListener("keydown", onKeydown);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        void cancel();
      }
    });
    cancelButton.addEventListener("click", () => {
      void cancel();
    });
    actionButton.addEventListener("click", () => {
      void runAction();
    });
  });
};

export const showTextareaDialog = (
  text: string,
  options: TextareaDialogOptions = {}
): Promise<string | null> => {
  const existingOverlay = document.getElementById(TEXTAREA_OVERLAY_ID);
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = TEXTAREA_OVERLAY_ID;
  overlay.className =
    "fixed inset-0 z-[1000000000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 160ms ease";

  const dialog = document.createElement("div");
  dialog.className =
    "w-full max-w-xl rounded-md border-2 border-yellow-500 bg-neutral-900 p-4 text-base shadow-2xl";
  dialog.style.opacity = "0";
  dialog.style.transform = "translateY(8px) scale(0.96)";
  dialog.style.transition =
    "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)";

  const textEl = document.createElement("p");
  textEl.className = "mb-3 text-base text-white";
  textEl.textContent = text;

  const textareaContainerEl = document.createElement("div");
  textareaContainerEl.className =
    "nav-dialog-rules-editor-container rounded-md border-2 border-transparent bg-neutral-800 p-1 text-base focus-within:border-sky-500";

  const highlightEl = document.createElement("pre");
  highlightEl.ariaHidden = "true";
  highlightEl.className = "nav-dialog-rules-editor-layer";

  const textareaEl = document.createElement("textarea");
  textareaEl.autocomplete = "off";
  textareaEl.spellcheck = false;
  textareaEl.rows = 4;
  textareaEl.className =
    "nav-dialog-rules-editor-layer nav-dialog-rules-textarea w-full resize-none bg-transparent text-base placeholder-neutral-500 outline-none";
  textareaEl.placeholder = options.placeholder ?? "* ^https?://example.com/*";
  textareaEl.value = options.defaultValue ?? "";
  textareaContainerEl.append(highlightEl, textareaEl);

  const noteEl = document.createElement("p");
  noteEl.className = "mt-2 text-base text-neutral-500";
  noteEl.textContent = options.note ?? "";

  const actions = document.createElement("div");
  actions.className = "mt-4 grid grid-cols-2 gap-2";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "cursor-pointer rounded-md bg-neutral-800 px-3 py-2 text-base text-white transition hover:bg-neutral-700";
  cancelButton.textContent = options.cancelText ?? "cancel";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className =
    "cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-base text-white transition hover:bg-yellow-600";
  confirmButton.textContent = options.confirmText ?? "add";

  actions.append(cancelButton, confirmButton);
  dialog.append(textEl, textareaContainerEl);

  if (noteEl.textContent) {
    dialog.append(noteEl);
  }

  dialog.append(actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    dialog.style.opacity = "1";
    dialog.style.transform = "translateY(0) scale(1)";
  });

  const syncHighlight = () => {
    const renderedValue = renderRulesUrlsValue(textareaEl.value);
    highlightEl.innerHTML = getTextareaOverlayHTML(textareaEl.value, renderedValue.html);
    highlightEl.scrollTop = textareaEl.scrollTop;
    highlightEl.scrollLeft = textareaEl.scrollLeft;
  };

  syncHighlight();

  return new Promise((resolve) => {
    let isClosing = false;

    const cleanup = async () => {
      if (isClosing) {
        return;
      }

      isClosing = true;
      document.removeEventListener("keydown", onKeydown);
      overlay.style.opacity = "0";
      dialog.style.opacity = "0";
      dialog.style.transform = "translateY(8px) scale(0.96)";
      await new Promise((done) => setTimeout(done, 160));
      overlay.remove();
    };

    const submit = async () => {
      const value = textareaEl.value;
      await cleanup();
      resolve(value);
    };

    const cancel = async () => {
      await cleanup();
      resolve(null);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void cancel();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void submit();
      }
    };

    document.addEventListener("keydown", onKeydown);
    textareaEl.addEventListener("input", syncHighlight);
    textareaEl.addEventListener("scroll", syncHighlight);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        void cancel();
      }
    });
    cancelButton.addEventListener("click", () => {
      void cancel();
    });
    confirmButton.addEventListener("click", () => {
      void submit();
    });

    setTimeout(() => {
      textareaEl.focus();
      textareaEl.select();
    }, 0);
  });
};