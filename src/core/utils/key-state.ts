import type { FastConfig, FastRule } from "~/src/utils/fast-config";
import type { ActionName, HotkeyActionMode, HotkeyMappings } from "~/src/utils/hotkeys";

const KEY_SEQUENCE_TIMEOUT_MS = 1000;

export type KeyParseResult = {
  actionName: ActionName | null;
  claimKeydown: boolean;
  consumed: boolean;
};

type WatchActionName =
  | "toggle-fullscreen"
  | "toggle-play-pause"
  | "toggle-loop"
  | "toggle-mute"
  | "toggle-captions";
type KeyStateMode = "normal" | "find" | "watch";

type CreateKeyStateDeps = {
  onReservedHintPrefixesChange: (prefixes: Set<string>) => void;
  getMode: () => KeyStateMode;
};

const getReservedHintPrefixes = (mappings: HotkeyMappings): Set<string> => {
  const reservedPrefixes = new Set<string>();

  for (const [sequence, bindings] of Object.entries(mappings)) {
    const hasHintsBinding = Object.values(bindings ?? {}).some(
      (actionName) => actionName === "hint-mode-current-tab" || actionName === "hint-mode-new-tab"
    );

    if (!hasHintsBinding) {
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
  let keyActions: HotkeyMappings = {};
  let keyActionPrefixes: Partial<Record<string, true>> = {};
  let urlRulesMode: FastConfig["rules"]["urls"]["mode"] = "blacklist";
  let urlBlacklistRules: Array<{ rule: FastRule; regex: RegExp }> = [];
  let urlWhitelistRules: Array<{ rule: FastRule; regex: RegExp }> = [];
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

  const compileUrlRules = (rules: FastRule[]): Array<{ rule: FastRule; regex: RegExp }> => {
    const compiledRules: Array<{ rule: FastRule; regex: RegExp }> = [];

    for (const rule of rules) {
      try {
        compiledRules.push({ rule, regex: new RegExp(rule.pattern) });
      } catch {
        continue;
      }
    }

    return compiledRules;
  };

  const getCurrentUrlRule = (): FastRule | null => {
    const currentUrl = window.location.href;
    const activeRules = urlRulesMode === "whitelist" ? urlWhitelistRules : urlBlacklistRules;

    for (const { rule, regex } of activeRules) {
      if (regex.test(currentUrl)) {
        return rule;
      }
    }

    return null;
  };

  const isActionAllowedForRule = (actionName: ActionName, rule: FastRule | null): boolean => {
    if (!rule) {
      return urlRulesMode !== "whitelist";
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

  const getActiveModes = (): HotkeyActionMode[] => {
    const mode = deps.getMode();

    if (mode === "find") {
      return ["find", "normal"];
    }

    if (mode === "watch") {
      return ["watch", "normal"];
    }

    return ["normal"];
  };

  const getAllowedActionForSequence = (sequence: string): ActionName | null => {
    const bindings = keyActions[sequence];
    if (!bindings) {
      return null;
    }

    const activeModes = getActiveModes();

    for (const mode of activeModes) {
      const actionName = bindings[mode];

      if (!actionName || !isActionAllowed(actionName)) {
        continue;
      }

      return actionName;
    }

    return null;
  };

  const hasAllowedActionPrefix = (
    sequence: string,
    predicate?: (actionName: ActionName) => boolean
  ): boolean => {
    const rule = getCurrentUrlRule();
    const activeModes = getActiveModes();

    return Object.entries(keyActions).some(([candidate, bindings]) => {
      if (candidate.length <= sequence.length || !candidate.startsWith(sequence)) {
        return false;
      }

      for (const mode of activeModes) {
        const actionName = bindings?.[mode];

        if (!actionName) {
          continue;
        }

        if (predicate && !predicate(actionName)) {
          continue;
        }

        if (isActionAllowedForRule(actionName, rule)) {
          return true;
        }
      }

      return false;
    });
  };

  const hasAllowedActionMappings = (): boolean => {
    const rule = getCurrentUrlRule();

    const activeModes = getActiveModes();

    return Object.values(keyActions).some((bindings) => {
      return activeModes.some((mode) => {
        const actionName = bindings?.[mode];
        return actionName ? isActionAllowedForRule(actionName, rule) : false;
      });
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
  ): actionName is "hint-mode-current-tab" | "hint-mode-new-tab" =>
    actionName === "hint-mode-current-tab" || actionName === "hint-mode-new-tab";

  return {
    applyHotkeyMappings: (
      mappings: HotkeyMappings,
      prefixes: Partial<Record<string, true>>
    ): void => {
      keyActions = mappings;
      keyActionPrefixes = prefixes;
      deps.onReservedHintPrefixesChange(getReservedHintPrefixes(mappings));
      clearPendingState();
    },
    applyUrlRules: (rules: FastConfig["rules"]["urls"]): void => {
      urlRulesMode = rules.mode;
      urlBlacklistRules = compileUrlRules(rules.blacklist);
      urlWhitelistRules = compileUrlRules(rules.whitelist);
      clearPendingState();
    },
    clearPendingCount,
    clearPendingState,
    hasAllowedActionMappings,
    resolveCount,
    isActionAllowed,
    getActionSequence: (actionName: WatchActionName, fallback: string): string => {
      const sequences = Object.entries(keyActions)
        .filter((entry): entry is [string, NonNullable<HotkeyMappings[string]>] => !!entry[1])
        .filter(([, candidateActions]) => candidateActions.watch === actionName)
        .map(([sequence]) => sequence)
        .sort((left, right) => left.length - right.length);

      return sequences[0] ?? fallback;
    },
    getActionName: (keyToken: string): KeyParseResult => {
      if (isCountKey(keyToken) && hasAllowedActionMappings()) {
        consumeCountKey(keyToken);
        return { actionName: null, claimKeydown: false, consumed: true };
      }

      const nextSequence = `${pendingSequence}${keyToken}`;
      const directMatch = getAllowedActionForSequence(nextSequence);

      if (directMatch) {
        clearPendingSequence();
        return { actionName: directMatch, claimKeydown: true, consumed: true };
      }

      const hasLongerMatch =
        keyActionPrefixes[nextSequence] === true && hasAllowedActionPrefix(nextSequence);

      if (hasLongerMatch) {
        startPendingSequence(nextSequence);
        return { actionName: null, claimKeydown: false, consumed: true };
      }

      clearPendingSequence();

      const actionName = getAllowedActionForSequence(keyToken);

      if (!actionName) {
        clearPendingCount();
        return { actionName: null, claimKeydown: false, consumed: false };
      }

      return { actionName, claimKeydown: true, consumed: true };
    },
    getToggleHintsActionName: (keyToken: string): KeyParseResult => {
      const nextSequence = `${pendingSequence}${keyToken}`;
      const directMatch = getAllowedActionForSequence(nextSequence);

      if (isToggleHintsAction(directMatch ?? null)) {
        clearPendingSequence();
        return { actionName: directMatch ?? null, claimKeydown: true, consumed: true };
      }

      const hasLongerToggleMatch = hasAllowedActionPrefix(nextSequence, (actionName) =>
        isToggleHintsAction(actionName)
      );

      if (hasLongerToggleMatch) {
        startPendingSequence(nextSequence);
        return { actionName: null, claimKeydown: false, consumed: true };
      }

      clearPendingSequence();
      return { actionName: null, claimKeydown: false, consumed: false };
    },
    getWatchActionName: (
      keyToken: string,
      sequences: Record<WatchActionName, string>
    ): KeyParseResult => {
      const nextSequence = `${pendingSequence}${keyToken}`;

      const directMatch = (Object.entries(sequences) as [WatchActionName, string][]).find(
        ([, sequence]) => nextSequence === sequence
      );

      if (directMatch) {
        clearPendingSequence();
        return { actionName: directMatch[0], claimKeydown: true, consumed: true };
      }

      const hasLongerMatch = Object.values(sequences).some((sequence) =>
        sequence.startsWith(nextSequence)
      );

      if (hasLongerMatch) {
        startPendingSequence(nextSequence);
        return { actionName: null, claimKeydown: false, consumed: true };
      }

      clearPendingSequence();
      return { actionName: null, claimKeydown: false, consumed: false };
    }
  };
};