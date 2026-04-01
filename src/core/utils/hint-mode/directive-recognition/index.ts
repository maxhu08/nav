import type { ReservedHintDirective } from "~/src/utils/hint-reserved-label-directives";
import type { DirectiveScorer } from "~/src/core/utils/hint-mode/directive-recognition/shared";
import { scoreAttachDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/attach";
import { scoreHomeDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/home";
import { scoreInputDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/input";
import { scoreMicrophoneDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/microphone";
import { scoreSidebarDirectiveCandidate } from "~/src/core/utils/hint-mode/directive-recognition/sidebar";

export const DIRECTIVE_SCORERS: Partial<Record<ReservedHintDirective, DirectiveScorer>> = {
  home: scoreHomeDirectiveCandidate,
  input: scoreInputDirectiveCandidate,
  sidebar: scoreSidebarDirectiveCandidate,
  attach: scoreAttachDirectiveCandidate,
  microphone: scoreMicrophoneDirectiveCandidate
};