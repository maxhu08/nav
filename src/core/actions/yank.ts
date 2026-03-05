import { activateHints } from "~/src/core/actions/hints";
import { ensureToastWrapper, getToastApi } from "~/src/core/utils/sonner";

type FetchImageResponse = {
  ok: boolean;
  bytes?: number[];
  mimeType?: string;
};

type ImageClipboardResult = "success" | "unsupported" | "error";

const writeClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }
};

const writeClipboardImage = async (image: HTMLImageElement): Promise<ImageClipboardResult> => {
  if (typeof ClipboardItem === "undefined" || typeof navigator.clipboard?.write !== "function") {
    return "unsupported";
  }

  const source = image.currentSrc || image.src;
  if (!source) {
    return "error";
  }

  const convertBlobToClipboardBlob = async (blob: Blob): Promise<Blob | null> => {
    if (!blob.type.startsWith("image/")) {
      return null;
    }

    try {
      if (blob.type === "image/png") {
        return blob;
      }

      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        return null;
      }

      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
      });
    } catch {
      return null;
    }
  };

  const writeBlobToClipboard = async (blob: Blob): Promise<ImageClipboardResult> => {
    const clipboardBlob = await convertBlobToClipboardBlob(blob);
    if (!clipboardBlob) {
      return "error";
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [clipboardBlob.type]: clipboardBlob
        })
      ]);

      return "success";
    } catch {
      return "error";
    }
  };

  const fetchImageBlobFromBackground = async (): Promise<Blob | null> => {
    try {
      const response = await new Promise<FetchImageResponse>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "fetch-image",
            url: source
          },
          (result?: FetchImageResponse) => {
            resolve(result ?? { ok: false });
          }
        );
      });

      if (!response.ok || !response.mimeType || !response.bytes) {
        return null;
      }

      return new Blob([new Uint8Array(response.bytes)], { type: response.mimeType });
    } catch {
      return null;
    }
  };

  try {
    const response = await fetch(source);
    if (!response.ok) {
      const backgroundBlob = await fetchImageBlobFromBackground();
      if (!backgroundBlob) {
        return "error";
      }

      return writeBlobToClipboard(backgroundBlob);
    }

    const blob = await response.blob();
    return writeBlobToClipboard(blob);
  } catch {
    const backgroundBlob = await fetchImageBlobFromBackground();
    if (!backgroundBlob) {
      return "error";
    }

    return writeBlobToClipboard(backgroundBlob);
  }
};

const getNormalizedUrl = (value: string): string => {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}${url.hash}`;
};

const getNormalizedCurrentUrl = (): string => getNormalizedUrl(window.location.href);

const getLinkUrl = (element: HTMLElement): string | null => {
  if (
    (element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
    element.href
  ) {
    return getNormalizedUrl(element.href);
  }

  return null;
};

const getImageUrl = (element: HTMLElement): string | null => {
  if (!(element instanceof HTMLImageElement)) {
    return null;
  }

  const source = element.currentSrc || element.src;
  if (!source) {
    return null;
  }

  return getNormalizedUrl(source);
};

const showYankToast = (type: "success" | "error", message: string, description: string): void => {
  ensureToastWrapper();
  const toast = getToastApi();

  if (type === "success") {
    toast?.success(message, { description });
    return;
  }

  toast?.error(message, { description });
};

const showImageYankToast = (image: HTMLImageElement): void => {
  ensureToastWrapper();
  const toast = getToastApi();
  const source = image.currentSrc || image.src;
  const altText = image.alt.trim();
  const captionText = /^(true|false)$/i.test(altText) ? "" : altText;
  const toastEl = toast?.success("Image yanked", { description: " " });

  if (!(toastEl instanceof HTMLElement) || !source) {
    return;
  }

  const descriptionEl = toastEl.querySelector("[data-description]");
  if (!(descriptionEl instanceof HTMLElement)) {
    return;
  }

  descriptionEl.textContent = "";
  descriptionEl.style.whiteSpace = "normal";
  descriptionEl.style.overflow = "visible";
  descriptionEl.style.textOverflow = "clip";
  descriptionEl.style.marginTop = "8px";

  const preview = document.createElement("img");
  preview.src = source;
  preview.alt = captionText || "Yanked image preview";
  preview.style.display = "block";
  preview.style.width = "100%";
  preview.style.maxHeight = "160px";
  preview.style.objectFit = "contain";
  preview.style.borderRadius = "8px";
  preview.style.background = "rgba(255, 255, 255, 0.04)";
  descriptionEl.append(preview);

  if (captionText) {
    const caption = document.createElement("div");
    caption.textContent = captionText;
    caption.style.marginTop = "8px";
    caption.style.color = "#a3a3a3";
    caption.style.fontSize = "14px";
    caption.style.lineHeight = "20px";
    descriptionEl.append(caption);
  }
};

export const yankCurrentTabUrl = (): boolean => {
  const currentUrl = getNormalizedCurrentUrl();

  void writeClipboard(currentUrl).then((didCopy) => {
    if (didCopy) {
      showYankToast("success", "Current tab URL yanked", currentUrl);
      return;
    }

    showYankToast("error", "Could not yank current tab URL", "Clipboard access was denied.");
  });

  return true;
};

export const yankLinkUrl = (): boolean => {
  const didActivate = activateHints("copy-link", {
    onActivate: (element) => {
      const linkUrl = getLinkUrl(element);

      if (!linkUrl) {
        showYankToast("error", "Could not yank link URL", "The selected target is not a link.");
        return;
      }

      void writeClipboard(linkUrl).then((didCopy) => {
        if (didCopy) {
          showYankToast("success", "Link URL yanked", linkUrl);
          return;
        }

        showYankToast("error", "Could not yank link URL", "Clipboard access was denied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank link URL", "No visible links were found.");
  }

  return true;
};

export const yankImage = (): boolean => {
  const didActivate = activateHints("copy-image", {
    onActivate: (element) => {
      if (!(element instanceof HTMLImageElement)) {
        showYankToast("error", "Could not yank image", "The selected target is not an image.");
        return;
      }

      void writeClipboardImage(element).then((result) => {
        if (result === "success") {
          showImageYankToast(element);
          return;
        }

        if (result === "unsupported") {
          showYankToast("error", "Could not yank image", "Image clipboard support is unavailable.");
          return;
        }

        showYankToast("error", "Could not yank image", "The image could not be copied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank image", "No visible images were found.");
  }

  return true;
};

export const yankImageUrl = (): boolean => {
  const didActivate = activateHints("copy-image", {
    onActivate: (element) => {
      const imageUrl = getImageUrl(element);

      if (!imageUrl) {
        showYankToast("error", "Could not yank image URL", "The selected target is not an image.");
        return;
      }

      void writeClipboard(imageUrl).then((didCopy) => {
        if (didCopy) {
          showYankToast("success", "Image URL yanked", imageUrl);
          return;
        }

        showYankToast("error", "Could not yank image URL", "Clipboard access was denied.");
      });
    }
  });

  if (!didActivate) {
    showYankToast("error", "Could not yank image URL", "No visible images were found.");
  }

  return true;
};
