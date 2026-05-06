import type {
  FetchSearchSuggestionsMessage,
  FetchSearchSuggestionsResponse
} from "~/src/shared/background-messages";

export const MAX_BAR_SUGGESTIONS = 8;

type BarSuggestionItem = {
  value: string;
  matchRanges: boolean[];
  directStartsWithQuery: boolean;
  directLink: boolean;
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

const uniq = (values: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();

    if (!trimmedValue || seen.has(trimmedValue.toLowerCase())) {
      continue;
    }

    seen.add(trimmedValue.toLowerCase());
    output.push(trimmedValue);
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
  suggestions: string[]
): BarSuggestionItem[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const values = uniq([trimmedQuery, ...suggestions]);
  const queryItem: BarSuggestionItem = {
    value: trimmedQuery,
    matchRanges: Array.from(trimmedQuery, () => true),
    directStartsWithQuery: true,
    directLink: looksLikeUrl(trimmedQuery)
  };
  const lowerQuery = trimmedQuery.toLowerCase();
  const rankedSuggestions = values
    .slice(1)
    .flatMap((value) => {
      const lowerValue = value.toLowerCase();
      const matchRanges =
        getContiguousMatchRangesFromLowerName(lowerValue, lowerQuery) ??
        getFuzzyMatchRangesFromLowerName(lowerValue, lowerQuery);

      if (!matchRanges) {
        return [];
      }

      return [
        {
          value,
          matchRanges,
          directStartsWithQuery: lowerValue.startsWith(lowerQuery),
          directLink: looksLikeUrl(value)
        } satisfies BarSuggestionItem
      ];
    })
    .sort((a, b) => {
      return a.directStartsWithQuery === b.directStartsWithQuery
        ? 0
        : a.directStartsWithQuery
          ? -1
          : 1;
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