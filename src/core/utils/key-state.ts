import type { FastConfig, FastRule } from "~/src/utils/fast-config";
import type { ActionName } from "~/src/utils/hotkeys";

const KEY_SEQUENCE_TIMEOUT_MS = 1000;

export type KeyParseResult = {
  actionName: ActionName | null;
  consumed: boolean;
};

type WatchActionName = "toggle-fullscreen" | "toggle-play-pause";

type CreateKeyStateDeps = {
  onReservedHintPrefixesChange: (prefixes: Set<string>) => void;
};

const getReservedHintPrefixes = (mappings: Partial<Record<string, ActionName>>): Set<string> => {
  const reservedPrefixes = new Set<string>();

  for (const [sequence, actionName] of Object.entries(mappings)) {
    if (actionName !== "toggle-hints-current-tab" && actionName !== "toggle-hints-new-tab") {
      continue;
    }

    const firstCharacter = sequence[0]?.toLowerCase();
    if (firstCharacter && /[a-z]/.test(firstCharacter)) {
      reservedPrefixes.add(firstCharacter);
    }
  }

  return reservedPrefixes;
};

const normalizeBaseKey = (key: string): string | null => {
  if (key === " ") {
    return "<space>";
  }

  if (key.length === 1) {
    return key;
  }

  return null;
};

export const isModifierKey = (key: string): boolean =>
  key === "Shift" || key === "Control" || key === "Alt" || key === "Meta";

export const getKeyToken = (event: KeyboardEvent): string | null => {
  const normalizedKey = normalizeBaseKey(event.key);

  if (!normalizedKey) {
    return null;
  }

  const modifiers: string[] = [];

  if (event.ctrlKey) {
    modifiers.push("c");
  }

  if (event.metaKey) {
    modifiers.push("m");
  }

  if (event.altKey) {
    modifiers.push("a");
  }

  if (modifiers.length > 0) {
    return `<${modifiers.join("-")}-${normalizedKey}>`;
  }

  return normalizedKey;
};

export const createKeyState = (deps: CreateKeyStateDeps) => {
  let keyActions: Partial<Record<string, ActionName>> = {};
  let keyActionPrefixes: Partial<Record<string, true>> = {};
  let urlRulesMode: FastConfig["rules"]["urls"]["mode"] = "blacklist";
  let urlBlacklistRules: FastRule[] = [];
  let urlWhitelistRules: FastRule[] = [];
  let pendingSequence = "";
  let pendingSequenceTimer: number | null = null;
  let pendingCount = "";

  const clearPendingSequence = (): void => {
    pendingSequence = "";

    if (pendingSequenceTimer !== null) {
      window.clearTimeout(pendingSequenceTimer);
      pendingSequenceTimer = null;
    }
  };

  const clearPendingCount = (): void => {
    pendingCount = "";
  };

  const clearPendingState = (): void => {
    clearPendingSequence();
    clearPendingCount();
  };

  const startPendingSequence = (sequence: string): void => {
    clearPendingSequence();
    pendingSequence = sequence;

    pendingSequenceTimer = window.setTimeout(() => {
      clearPendingSequence();
    }, KEY_SEQUENCE_TIMEOUT_MS);
  };

  const getCurrentUrlRule = (): FastRule | null => {
    const currentUrl = window.location.href;
    const activeRules = urlRulesMode === "whitelist" ? urlWhitelistRules : urlBlacklistRules;

    for (const rule of activeRules) {
      if (new RegExp(rule.pattern).test(currentUrl)) {
        return rule;
      }
    }

    return null;
  };

  const isActionAllowedForRule = (actionName: ActionName, rule: FastRule | null): boolean => {
    if (!rule) {
      return true;
    }

    const isListedAction = rule.actions[actionName] === true;

    if (rule.mode === "allow") {
      return isListedAction;
    }

    return !isListedAction;
  };

  const isActionAllowed = (actionName: ActionName): boolean => {
    return isActionAllowedForRule(actionName, getCurrentUrlRule());
  };

  const getAllowedActionForSequence = (sequence: string): ActionName | null => {
    const actionName = keyActions[sequence] ?? null;

    if (!actionName || !isActionAllowed(actionName)) {
      return null;
    }

    return actionName;
  };

  const hasAllowedActionPrefix = (
    sequence: string,
    predicate?: (actionName: ActionName) => boolean
  ): boolean => {
    const rule = getCurrentUrlRule();

    return Object.entries(keyActions).some(([candidate, actionName]) => {
      if (!actionName || candidate.length <= sequence.length || !candidate.startsWith(sequence)) {
        return false;
      }

      if (predicate && !predicate(actionName)) {
        return false;
      }

      return isActionAllowedForRule(actionName, rule);
    });
  };

  const hasAllowedActionMappings = (): boolean => {
    const rule = getCurrentUrlRule();

    return Object.values(keyActions).some((actionName) => {
      return actionName ? isActionAllowedForRule(actionName, rule) : false;
    });
  };

  const isCountKey = (key: string): boolean => {
    if (pendingCount) {
      return key >= "0" && key <= "9";
    }

    return key >= "1" && key <= "9";
  };

  const consumeCountKey = (key: string): void => {
    pendingCount = pendingSequence ? key : `${pendingCount}${key}`;
    clearPendingSequence();
  };

  const resolveCount = (): number => {
    const count = pendingCount ? Number.parseInt(pendingCount, 10) : 1;
    clearPendingCount();
    return count;
  };

  const isToggleHintsAction = (
    actionName: ActionName | null
  ): actionName is "toggle-hints-current-tab" | "toggle-hints-new-tab" =>
    actionName === "toggle-hints-current-tab" || actionName === "toggle-hints-new-tab";

  return {
    applyHotkeyMappings: (
      mappings: Partial<Record<string, ActionName>>,
      prefixes: Partial<Record<string, true>>
    ): void => {
      keyActions = mappings;
      keyActionPrefixes = prefixes;
      deps.onReservedHintPrefixesChange(getReservedHintPrefixes(mappings));
      clearPendingState();
    },
    applyUrlRules: (rules: FastConfig["rules"]["urls"]): void => {
      urlRulesMode = rules.mode;
      urlBlacklistRules = rules.blacklist;
      urlWhitelistRules = rules.whitelist;
      clearPendingState();
    },
    clearPendingCount,
    clearPendingState,
    resolveCount,
    isActionAllowed,
    getActionSequence: (actionName: WatchActionName, fallback: string): string => {
      const sequences = Object.entries(keyActions)
        .filter((entry): entry is [string, ActionName] => !!entry[1])
        .filter(([, candidateAction]) => candidateAction === actionName)
        .map(([sequence]) => sequence)
        .sort((left, right) => left.length - right.length);

      return sequences[0] ?? fallback;
    },
    getActionName: (keyToken: string): KeyParseResult => {
      if (isCountKey(keyToken) && hasAllowedActionMappings()) {
        consumeCountKey(keyToken);
        return { actionName: null, consumed: true };
      }

      const nextSequence = `${pendingSequence}${keyToken}`;
      const directMatch = getAllowedActionForSequence(nextSequence);

      if (directMatch) {
        clearPendingSequence();
        return { actionName: directMatch, consumed: true };
      }

      const hasLongerMatch =
        keyActionPrefixes[nextSequence] === true && hasAllowedActionPrefix(nextSequence);

      if (hasLongerMatch) {
        startPendingSequence(nextSequence);
        return { actionName: null, consumed: true };
      }

      clearPendingSequence();

      const actionName = getAllowedActionForSequence(keyToken);

      if (!actionName) {
        clearPendingCount();
        return { actionName: null, consumed: false };
      }

      return { actionName, consumed: true };
    },
    getToggleHintsActionName: (keyToken: string): KeyParseResult => {
      const nextSequence = `${pendingSequence}${keyToken}`;
      const directMatch = getAllowedActionForSequence(nextSequence);

      if (isToggleHintsAction(directMatch ?? null)) {
        clearPendingSequence();
        return { actionName: directMatch ?? null, consumed: true };
      }

      const hasLongerToggleMatch = hasAllowedActionPrefix(nextSequence, (actionName) =>
        isToggleHintsAction(actionName)
      );

      if (hasLongerToggleMatch) {
        startPendingSequence(nextSequence);
        return { actionName: null, consumed: true };
      }

      clearPendingSequence();
      return { actionName: null, consumed: false };
    },
    getWatchActionName: (
      keyToken: string,
      fullscreenSequence: string,
      pauseSequence: string
    ): KeyParseResult => {
      const nextSequence = `${pendingSequence}${keyToken}`;

      if (nextSequence === fullscreenSequence) {
        clearPendingSequence();
        return { actionName: "toggle-fullscreen", consumed: true };
      }

      if (nextSequence === pauseSequence) {
        clearPendingSequence();
        return { actionName: "toggle-play-pause", consumed: true };
      }

      if (fullscreenSequence.startsWith(nextSequence) || pauseSequence.startsWith(nextSequence)) {
        startPendingSequence(nextSequence);
        return { actionName: null, consumed: true };
      }

      clearPendingSequence();
      return { actionName: null, consumed: false };
    }
  };
};
