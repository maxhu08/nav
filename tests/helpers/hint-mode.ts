import { createDomFixture } from "~/tests/helpers/dom-fixture";

type HintModeModule = typeof import("~/src/core/actions/hint-mode");
type HintController = ReturnType<HintModeModule["createHintController"]>;
type TestMode = "normal" | "hint";

export const withHintModeModule = async <T>(
  outerHTML: string | string[],
  run: (context: { generateHintLabels: HintModeModule["generateHintLabels"] }) => Promise<T> | T
): Promise<T> => {
  const fixture = createDomFixture(outerHTML);

  try {
    const { generateHintLabels } = await import("~/src/core/actions/hint-mode");
    return await run({ generateHintLabels });
  } finally {
    fixture.cleanup();
  }
};

export const withHintController = async <T>(
  outerHTML: string | string[],
  run: (context: { controller: HintController; getMode: () => TestMode }) => Promise<T> | T
): Promise<T> => {
  const fixture = createDomFixture(outerHTML);

  try {
    const { createHintController } = await import("~/src/core/actions/hint-mode");
    let mode: TestMode = "normal";
    const controller = createHintController({
      setMode: (nextMode): void => {
        mode = nextMode === "watch" || nextMode === "find" ? "normal" : nextMode;
      }
    });

    return await run({ controller, getMode: () => mode });
  } finally {
    fixture.cleanup();
  }
};