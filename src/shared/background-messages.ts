import type { TabCommand } from "~/src/core/actions/tabs";

export type FetchImageMessage = {
  type: "fetch-image";
  url: string;
};

export type FetchImageResponse = {
  ok: boolean;
  bytes?: number[];
  mimeType?: string;
};

export type TabCommandMessage = {
  type: "tab-command";
  command: TabCommand;
  tabId?: number;
  tabIndex?: number;
  windowId?: number;
};

export type TabCommandResponse = {
  ok: boolean;
};

export type FetchSearchSuggestionsMessage = {
  type: "fetch-search-suggestions";
  query: string;
};

export type FetchSearchSuggestionsResponse = {
  ok: boolean;
  suggestions: string[];
  error?: string;
};

export type HistorySuggestion = {
  value: string;
  directLink: boolean;
};

export type FetchHistorySuggestionsMessage = {
  type: "fetch-history-suggestions";
  query: string;
};

export type FetchHistorySuggestionsResponse = {
  ok: boolean;
  suggestions: HistorySuggestion[];
  error?: string;
};

export const isFetchImageMessage = (value: unknown): value is FetchImageMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FetchImageMessage>;
  return data.type === "fetch-image" && typeof data.url === "string";
};

export const isTabCommandMessage = (value: unknown): value is TabCommandMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<TabCommandMessage>;
  return data.type === "tab-command" && typeof data.command === "string";
};

export const isFetchSearchSuggestionsMessage = (
  value: unknown
): value is FetchSearchSuggestionsMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FetchSearchSuggestionsMessage>;
  return data.type === "fetch-search-suggestions" && typeof data.query === "string";
};

export const isFetchHistorySuggestionsMessage = (
  value: unknown
): value is FetchHistorySuggestionsMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FetchHistorySuggestionsMessage>;
  return data.type === "fetch-history-suggestions" && typeof data.query === "string";
};