const DEFAULT_EXTENSION_NAMESPACE = "nav-extension";

export const getExtensionNamespace = (): string => {
  const runtimeId = globalThis.chrome?.runtime?.id;

  if (typeof runtimeId === "string" && runtimeId.length > 0) {
    return runtimeId;
  }

  return DEFAULT_EXTENSION_NAMESPACE;
};
