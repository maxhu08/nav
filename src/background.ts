import { registerRuntimeBridge } from "~/src/background/bridge";
import {
  handleActivateTabMessage,
  handleFetchTabSuggestionsMessage
} from "~/src/background/bar-tabs";
import { handleFetchImageMessage } from "~/src/background/fetch-image";
import { handleFetchHistorySuggestionsMessage } from "~/src/background/fetch-history-suggestions";
import { handleFetchSearchSuggestionsMessage } from "~/src/background/fetch-search-suggestions";
import { handleTabCommandMessage } from "~/src/background/tab-commands";
import {
  isActivateTabMessage,
  isFetchTabSuggestionsMessage,
  isFetchImageMessage,
  isFetchHistorySuggestionsMessage,
  isFetchSearchSuggestionsMessage,
  isTabCommandMessage
} from "~/src/shared/background-messages";

registerRuntimeBridge();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (isFetchTabSuggestionsMessage(message)) {
    void handleFetchTabSuggestionsMessage(sender).then(sendResponse);
    return true;
  }

  if (isActivateTabMessage(message)) {
    void handleActivateTabMessage(message.tabId, sender).then(sendResponse);
    return true;
  }

  if (isFetchImageMessage(message)) {
    void handleFetchImageMessage(message.url).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  if (isFetchSearchSuggestionsMessage(message)) {
    void handleFetchSearchSuggestionsMessage(message.query).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  if (isFetchHistorySuggestionsMessage(message)) {
    void handleFetchHistorySuggestionsMessage(message.query).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  if (isTabCommandMessage(message)) {
    void handleTabCommandMessage(sender, message).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  return false;
});