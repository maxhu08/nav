import { sendFrameActionMessage } from "~/src/core/utils/runtime-bridge";
import { type ActionName } from "~/src/utils/hotkeys";

type FrameActionMessage = {
  actionName: ActionName;
};

const FRAME_PROXY_ACTIONS = new Set<ActionName>([
  "watch-mode",
  "toggle-fullscreen",
  "toggle-play-pause",
  "toggle-loop",
  "toggle-mute",
  "toggle-captions"
]);

export const isFrameActionMessage = (value: unknown): value is FrameActionMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FrameActionMessage>;
  return (
    typeof data.actionName === "string" && FRAME_PROXY_ACTIONS.has(data.actionName as ActionName)
  );
};

export const proxyActionToFrames = (actionName: ActionName): boolean => {
  if (!FRAME_PROXY_ACTIONS.has(actionName)) {
    return false;
  }

  return sendFrameActionMessage(actionName);
};