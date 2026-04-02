import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";
import type { DirectiveScorer } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import { scoreAttachDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/attach";
import { scoreCancelDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/cancel";
import { scoreChatDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/chat";
import { scoreCopyDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/copy";
import { scoreDeleteDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/delete";
import { scoreDislikeDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/dislike";
import { scoreDownloadDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/download";
import { scoreHomeDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/home";
import { scoreInputDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/input";
import { scoreLikeDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/like";
import { scoreLoginDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/login";
import { scoreMicrophoneDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/microphone";
import { scoreNotificationDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/notification";
import { scoreSaveDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/save";
import { scoreShareDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/share";
import { scoreSidebarDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/sidebar";
import { scoreSubmitDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/submit";

// erase uses the same element as input
// prev and next use the same as the element from follow-prev and follow-next
export const DIRECTIVE_SCORERS: Partial<Record<ReservedHintDirective, DirectiveScorer>> = {
  home: scoreHomeDirectiveCandidate,
  input: scoreInputDirectiveCandidate,
  sidebar: scoreSidebarDirectiveCandidate,
  attach: scoreAttachDirectiveCandidate,
  chat: scoreChatDirectiveCandidate,
  share: scoreShareDirectiveCandidate,
  download: scoreDownloadDirectiveCandidate,
  login: scoreLoginDirectiveCandidate,
  microphone: scoreMicrophoneDirectiveCandidate,
  notification: scoreNotificationDirectiveCandidate,
  delete: scoreDeleteDirectiveCandidate,
  save: scoreSaveDirectiveCandidate,
  copy: scoreCopyDirectiveCandidate,
  cancel: scoreCancelDirectiveCandidate,
  submit: scoreSubmitDirectiveCandidate,
  like: scoreLikeDirectiveCandidate,
  dislike: scoreDislikeDirectiveCandidate
};