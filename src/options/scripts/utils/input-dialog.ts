import { renderRulesUrlsValue } from "~/src/options/scripts/utils/rules-highlight";
import { getTextareaOverlayHTML } from "~/src/options/scripts/utils/editor-highlight";
import { t } from "~/src/options/scripts/i18n";
import { getToastApi } from "~/src/options/scripts/utils/sonner";

type InputDialogOptions = {
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  note?: string;
  fileInput?: {
    text: string;
    accept: string;
  };
};

type ActionDialogOptions = {
  cancelText?: string;
  actionText?: string;
  onAction: () => void | Promise<void>;
  variant?: "export";
  additionalAction?: {
    text: string;
    onAction: () => void | Promise<void>;
  };
};

type TextareaDialogOptions = {
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  note?: string;
};

type PlainTextareaDialogOptions = {
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
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", text);
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
  inputEl.placeholder = options.placeholder ?? t("Paste here...");
  inputEl.value = options.defaultValue ?? "";
  inputContainerEl.append(inputEl);

  const noteEl = document.createElement("p");
  noteEl.className = "mt-2 text-base text-neutral-500";
  noteEl.textContent = options.note ?? "";

  const actions = document.createElement("div");
  actions.className = "mt-4 grid grid-cols-2 gap-2";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "cursor-pointer rounded-md bg-neutral-800 px-3 py-2 text-base text-white transition hover:bg-neutral-700";
  cancelButton.textContent = options.cancelText ?? t("cancel");

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className =
    "cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-base text-white transition hover:bg-yellow-600";
  confirmButton.textContent = options.confirmText ?? t("ok");

  actions.append(cancelButton, confirmButton);
  dialog.append(textEl, inputContainerEl);

  if (noteEl.textContent) {
    dialog.append(noteEl);
  }

  dialog.append(actions);

  if (options.fileInput) {
    const separator = document.createElement("p");
    separator.className = "my-3 text-center text-base text-neutral-400";
    separator.textContent = t("or");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = options.fileInput.accept;
    fileInput.hidden = true;

    const uploadButton = document.createElement("button");
    uploadButton.type = "button";
    uploadButton.className =
      "w-full cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-base text-white transition hover:bg-yellow-600";
    uploadButton.textContent = options.fileInput.text;
    uploadButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      try {
        inputEl.value = await file.text();
        inputEl.focus();
      } catch {
        getToastApi()?.error(t("Could not read file."));
      }
      fileInput.value = "";
    });

    dialog.insertBefore(separator, actions);
    dialog.insertBefore(uploadButton, actions);
    dialog.append(fileInput);
  }

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

      if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
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
  dialog.className = `w-full max-w-xl rounded-md border-2 ${options.variant === "export" ? "border-yellow-500" : "border-rose-500"} bg-neutral-900 p-4 text-base shadow-2xl`;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", text);
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
  cancelButton.textContent = options.cancelText ?? t("cancel");

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.className = `cursor-pointer rounded-md ${options.variant === "export" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-rose-500 hover:bg-rose-600"} px-3 py-2 text-base text-white transition`;
  actionButton.textContent = options.actionText ?? t("confirm");

  const additionalButton = options.additionalAction ? document.createElement("button") : null;
  if (additionalButton && options.additionalAction) {
    const separator = document.createElement("p");
    separator.className = "text-center text-base text-neutral-400";
    separator.textContent = t("or");

    additionalButton.type = "button";
    additionalButton.className = actionButton.className;
    additionalButton.textContent = options.additionalAction.text;

    actions.className = "mt-4 grid grid-cols-1 gap-2";
    cancelButton.classList.add("mt-2");
    actions.append(actionButton, separator, additionalButton, cancelButton);
  } else {
    actions.append(cancelButton, actionButton);
  }
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

    const runAction = async (action = options.onAction) => {
      if (isClosing) return;

      await cleanup();
      await action();
      resolve(true);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void cancel();
      }

      if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        void runAction();
      }

      if (event.key === "Tab") {
        const buttons = Array.from(dialog.querySelectorAll("button")).filter(
          (button) => !button.disabled
        );
        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
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
    additionalButton?.addEventListener("click", () => {
      if (options.additionalAction) void runAction(options.additionalAction.onAction);
    });

    actionButton.focus();
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
  cancelButton.textContent = options.cancelText ?? t("cancel");

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className =
    "cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-base text-white transition hover:bg-yellow-600";
  confirmButton.textContent = options.confirmText ?? t("add");

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

export const showPlainTextareaDialog = (
  text: string,
  options: PlainTextareaDialogOptions = {}
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
    "w-full max-w-5xl rounded-md border-2 border-emerald-500 bg-neutral-900 p-4 text-base shadow-2xl";
  dialog.style.opacity = "0";
  dialog.style.transform = "translateY(8px) scale(0.96)";
  dialog.style.transition =
    "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)";

  const textEl = document.createElement("p");
  textEl.className = "mb-3 text-base text-white";
  textEl.textContent = text;

  const textareaContainerEl = document.createElement("div");
  textareaContainerEl.className =
    "w-full rounded-md border-2 border-transparent bg-neutral-800 p-1 text-base focus-within:border-sky-500";

  const textareaEl = document.createElement("textarea");
  textareaEl.autocomplete = "off";
  textareaEl.spellcheck = false;
  textareaEl.rows = 10;
  textareaEl.className =
    "w-full resize-none bg-transparent px-2 py-1 text-base text-white placeholder-neutral-500 outline-none";
  textareaEl.placeholder = options.placeholder ?? t("Paste here...");
  textareaEl.value = options.defaultValue ?? "";
  textareaContainerEl.append(textareaEl);

  const noteEl = document.createElement("p");
  noteEl.className = "mt-2 text-base text-neutral-500";
  noteEl.textContent = options.note ?? "";

  const actions = document.createElement("div");
  actions.className = "mt-4 grid grid-cols-2 gap-2";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "cursor-pointer rounded-md bg-neutral-800 px-3 py-2 text-base text-white transition hover:bg-neutral-700";
  cancelButton.textContent = options.cancelText ?? t("cancel");

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className =
    "cursor-pointer rounded-md bg-emerald-500 px-3 py-2 text-base text-white transition hover:bg-emerald-600";
  confirmButton.textContent = options.confirmText ?? t("ok");

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