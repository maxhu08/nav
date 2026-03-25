const getKeyboardEventId = (event: KeyboardEvent): string => {
  const location = Number.isInteger(event.location) ? event.location : 0;

  if (event.code) {
    return `${event.code}:${location}`;
  }

  return `${event.key}:${location}`;
};

export const createKeyboardPriorityController = () => {
  const claimedKeyIds = new Set<string>();
  let isInstalled = false;

  const clearClaimedKeys = (): void => {
    claimedKeyIds.clear();
  };

  const releaseClaimBeforeFreshKeydown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    claimedKeyIds.delete(getKeyboardEventId(event));
  };

  const suppressClaimedFollowupEvent = (event: KeyboardEvent): void => {
    const eventId = getKeyboardEventId(event);
    if (!claimedKeyIds.has(eventId)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.type === "keyup") {
      claimedKeyIds.delete(eventId);
    }
  };

  return {
    handleConsumedKeydown: (event: KeyboardEvent): void => {
      claimedKeyIds.add(getKeyboardEventId(event));
    },
    install: (): void => {
      if (isInstalled) {
        return;
      }

      isInstalled = true;
      window.addEventListener("blur", clearClaimedKeys, true);
      document.addEventListener("visibilitychange", clearClaimedKeys, true);
      window.addEventListener("keydown", releaseClaimBeforeFreshKeydown, true);
      window.addEventListener("keypress", suppressClaimedFollowupEvent, true);
      window.addEventListener("keyup", suppressClaimedFollowupEvent, true);
    },
    uninstall: (): void => {
      if (!isInstalled) {
        return;
      }

      isInstalled = false;
      clearClaimedKeys();
      window.removeEventListener("blur", clearClaimedKeys, true);
      document.removeEventListener("visibilitychange", clearClaimedKeys, true);
      window.removeEventListener("keydown", releaseClaimBeforeFreshKeydown, true);
      window.removeEventListener("keypress", suppressClaimedFollowupEvent, true);
      window.removeEventListener("keyup", suppressClaimedFollowupEvent, true);
    }
  };
};