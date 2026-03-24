const DEFAULT_EXTENSION_NAMESPACE = "nav-extension";

export const getExtensionNamespace = (): string => {
  const runtimeId = globalThis.chrome?.runtime?.id;

  if (typeof runtimeId === "string" && runtimeId.length > 0) {
    return (
      runtimeId.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || DEFAULT_EXTENSION_NAMESPACE
    );
  }

  return DEFAULT_EXTENSION_NAMESPACE;
};