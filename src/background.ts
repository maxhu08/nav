import { registerRuntimeBridge } from "~/src/background/bridge";
import { handleFetchImageMessage } from "~/src/background/fetch-image";
import { handleFetchSearchSuggestionsMessage } from "~/src/background/fetch-search-suggestions";
import { handleTabCommandMessage } from "~/src/background/tab-commands";
import {
  isFetchImageMessage,
  isFetchSearchSuggestionsMessage,
  isTabCommandMessage
} from "~/src/shared/background-messages";

registerRuntimeBridge();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
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

  if (isTabCommandMessage(message)) {
    void handleTabCommandMessage(sender, message).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  return false;
});