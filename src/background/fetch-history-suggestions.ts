import type {
  FetchHistorySuggestionsResponse,
  HistorySuggestion
} from "~/src/shared/background-messages";

const looksLikeUrl = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return true;
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#]|$)/i.test(normalized)) {
    return true;
  }

  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(normalized);
};

const getSearchQueryFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    for (const key of ["q", "query", "p", "text"]) {
      const value = parsed.searchParams.get(key)?.trim();
      if (value) {
        return value;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const getHistorySuggestionValues = (item: chrome.history.HistoryItem): HistorySuggestion[] => {
  const values: HistorySuggestion[] = [];
  const title = item.title?.trim();
  const url = item.url?.trim();

  if (title) {
    values.push({ value: title, directLink: false });
  }

  const searchQuery = url ? getSearchQueryFromUrl(url) : null;
  if (searchQuery) {
    values.push({ value: searchQuery, directLink: false });
  }

  if (url && looksLikeUrl(url) && !searchQuery) {
    values.push({ value: url, directLink: true });
  }

  return values;
};

export const handleFetchHistorySuggestionsMessage = async (
  query: string
): Promise<FetchHistorySuggestionsResponse> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { ok: true, suggestions: [] };
  }

  try {
    const results = await chrome.history.search({
      text: trimmedQuery,
      maxResults: 20,
      startTime: 0
    });

    return {
      ok: true,
      suggestions: results.flatMap(getHistorySuggestionValues)
    };
  } catch (error) {
    return {
      ok: false,
      suggestions: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
};