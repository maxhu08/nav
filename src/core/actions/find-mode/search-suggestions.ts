import type {
  FetchHistorySuggestionsMessage,
  FetchHistorySuggestionsResponse,
  FetchSearchSuggestionsMessage,
  FetchSearchSuggestionsResponse,
  HistorySuggestion
} from "~/src/shared/background-messages";

export const MAX_BAR_SUGGESTIONS = 8;

export type BarSuggestionSeed = {
  value: string;
  source: "search" | "history";
  directLink: boolean;
};

export type BarSuggestionItem = BarSuggestionSeed & {
  value: string;
  matchRanges: boolean[];
  directStartsWithQuery: boolean;
};

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

const uniq = (values: BarSuggestionSeed[]): BarSuggestionSeed[] => {
  const seen = new Set<string>();
  const output: BarSuggestionSeed[] = [];

  for (const value of values) {
    const trimmedValue = value.value.trim();

    if (!trimmedValue || seen.has(trimmedValue.toLowerCase())) {
      continue;
    }

    seen.add(trimmedValue.toLowerCase());
    output.push({ ...value, value: trimmedValue });
  }

  return output;
};

const getContiguousMatchRangesFromLowerName = (
  lowerName: string,
  lowerQuery: string
): boolean[] | null => {
  const ranges = Array.from(lowerName, () => false);
  const query = lowerQuery.trim();

  if (!query) {
    return null;
  }

  const matchIndex = lowerName.indexOf(query);
  if (matchIndex === -1) {
    return null;
  }

  for (let index = matchIndex; index < matchIndex + query.length; index++) {
    ranges[index] = true;
  }

  return ranges;
};

const getFuzzyMatchRangesFromLowerName = (
  lowerName: string,
  lowerQuery: string
): boolean[] | null => {
  const ranges = Array.from(lowerName, () => false);
  const query = lowerQuery.trim();

  if (!query) {
    return null;
  }

  let queryIndex = 0;
  let matchedChars = 0;

  for (let index = 0; index < lowerName.length && queryIndex < query.length; index++) {
    while (query[queryIndex] === " ") {
      queryIndex++;
    }

    if (queryIndex >= query.length) {
      break;
    }

    if (lowerName[index] !== query[queryIndex]) {
      continue;
    }

    ranges[index] = true;
    queryIndex++;
    matchedChars++;
  }

  while (query[queryIndex] === " ") {
    queryIndex++;
  }

  if (queryIndex !== query.length || matchedChars === 0) {
    return null;
  }

  return ranges;
};

export const getBarSuggestionItems = (
  query: string,
  suggestions: BarSuggestionSeed[]
): BarSuggestionItem[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const values = uniq([
    {
      value: trimmedQuery,
      source: "search",
      directLink: looksLikeUrl(trimmedQuery)
    },
    ...suggestions
  ]);
  const queryItem: BarSuggestionItem = {
    ...values[0]!,
    matchRanges: Array.from(trimmedQuery, () => true),
    directStartsWithQuery: true
  };
  const lowerQuery = trimmedQuery.toLowerCase();
  const rankedSuggestions = values
    .slice(1)
    .flatMap((value) => {
      const lowerValue = value.value.toLowerCase();
      const matchRanges =
        getContiguousMatchRangesFromLowerName(lowerValue, lowerQuery) ??
        getFuzzyMatchRangesFromLowerName(lowerValue, lowerQuery);

      if (!matchRanges) {
        return [];
      }

      return [
        {
          ...value,
          directLink: value.directLink || looksLikeUrl(value.value),
          matchRanges,
          directStartsWithQuery: lowerValue.startsWith(lowerQuery)
        } satisfies BarSuggestionItem
      ];
    })
    .sort((a, b) => {
      if (a.directStartsWithQuery !== b.directStartsWithQuery) {
        return a.directStartsWithQuery ? -1 : 1;
      }

      if (a.source !== b.source) {
        return a.source === "history" ? -1 : 1;
      }

      return 0;
    });

  return [queryItem, ...rankedSuggestions].slice(0, MAX_BAR_SUGGESTIONS);
};

export const fetchSearchSuggestions = async (query: string): Promise<string[]> => {
  const response = await chrome.runtime.sendMessage<
    FetchSearchSuggestionsMessage,
    FetchSearchSuggestionsResponse
  >({ type: "fetch-search-suggestions", query });

  if (!response.ok) {
    throw new Error(response.error ?? "Failed to fetch search suggestions");
  }

  return Array.isArray(response.suggestions) ? response.suggestions : [];
};

export const fetchHistorySuggestions = async (query: string): Promise<BarSuggestionSeed[]> => {
  const response = await chrome.runtime.sendMessage<
    FetchHistorySuggestionsMessage,
    FetchHistorySuggestionsResponse
  >({ type: "fetch-history-suggestions", query });

  if (!response.ok) {
    throw new Error(response.error ?? "Failed to fetch history suggestions");
  }

  return Array.isArray(response.suggestions)
    ? response.suggestions.map((suggestion: HistorySuggestion) => ({
        value: suggestion.value,
        source: "history",
        directLink: suggestion.directLink
      }))
    : [];
};