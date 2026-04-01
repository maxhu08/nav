import { expect } from "bun:test";
import type { buildHintTargets } from "~/src/core/utils/hint-mode/collection/build-hint-targets";
import {
  MARKER_ICON_ATTRIBUTE,
  MARKER_VARIANT_ATTRIBUTE
} from "~/src/core/utils/hint-mode/shared/constants";
import { parseReservedHintDirectives } from "~/src/utils/hint-reserved-label-directives";

export const directiveLabels = parseReservedHintDirectives(
  `@input kj\n@erase er\n@attach up\n@microphone mic\n@sidebar we\n@home sd`
);

export const expectDirectiveIconMarker = (
  target: ReturnType<typeof buildHintTargets>[number] | undefined,
  iconPath: string
): void => {
  expect(target?.marker.getAttribute(MARKER_VARIANT_ATTRIBUTE)).toBe("directive");
  expect(target?.marker.querySelector(`[${MARKER_ICON_ATTRIBUTE}="true"]`)?.innerHTML).toContain(
    iconPath
  );
};