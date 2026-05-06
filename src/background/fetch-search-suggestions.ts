import type { FetchSearchSuggestionsResponse } from "~/src/shared/background-messages";

export const handleFetchSearchSuggestionsMessage = async (
  query: string
): Promise<FetchSearchSuggestionsResponse> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { ok: true, suggestions: [] };
  }

  try {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        suggestions: [],
        error: `Search suggestions request failed: HTTP ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    const suggestions = Array.isArray(data)
      ? data
          .map((item) => (typeof item === "string" ? item : item && item.phrase))
          .filter((item): item is string => typeof item === "string")
      : [];

    return { ok: true, suggestions };
  } catch (error) {
    return {
      ok: false,
      suggestions: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
};