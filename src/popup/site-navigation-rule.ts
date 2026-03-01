import { type Config } from "~/src/utils/config";

type ManagedPageRule = {
  lines: string[];
  commentedLines: string[];
  pattern: string;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const splitLines = (value: string): string[] => {
  return value.length === 0 ? [] : value.split("\n");
};

const joinLines = (lines: string[]): string => {
  const normalizedLines = [...lines];

  while (normalizedLines.length > 0 && normalizedLines.at(-1)?.trim() === "") {
    normalizedLines.pop();
  }

  return normalizedLines.join("\n");
};

export const getWebsiteRulePattern = (url: URL): string => {
  const hostnamePattern = escapeRegex(url.hostname);
  return `^https?://${hostnamePattern}/*`;
};

export const getDefaultWebsiteRuleSnippet = (url: URL): string => {
  return `* ${getWebsiteRulePattern(url)}`;
};

const normalizeRuleSnippet = (value: string): string => {
  return joinLines(splitLines(value));
};

const buildManagedPageRule = (url: URL, snippet: string): ManagedPageRule => {
  const pattern = getWebsiteRulePattern(url);
  const normalizedSnippet = normalizeRuleSnippet(snippet);
  const lines = splitLines(normalizedSnippet);

  return {
    lines,
    commentedLines: lines.map((line) => (line.trim() ? `# ${line}` : line)),
    pattern
  };
};

const isManagedRuleLine = (line: string, managedPageRule: ManagedPageRule): boolean => {
  const trimmedLine = line.trim();
  return (
    managedPageRule.lines.some((candidate) => candidate.trim() === trimmedLine) ||
    managedPageRule.commentedLines.some((candidate) => candidate.trim() === trimmedLine)
  );
};

const findManagedRuleStartIndex = (lines: string[], pattern: string): number => {
  return lines.findIndex((line) => {
    const trimmedLine = line.trim();
    return trimmedLine === `* ${pattern}` || trimmedLine === `# * ${pattern}`;
  });
};

export const getManagedWebsiteRuleSnippet = (rulesUrls: string, url: URL): string => {
  const lines = splitLines(rulesUrls);
  const pattern = getWebsiteRulePattern(url);
  const startIndex = findManagedRuleStartIndex(lines, pattern);

  if (startIndex === -1) {
    return getDefaultWebsiteRuleSnippet(url);
  }

  const snippetLines = [lines[startIndex] ?? ""];
  const nextLine = lines[startIndex + 1];

  if (typeof nextLine === "string") {
    const trimmedNextLine = nextLine.trim();

    if (
      trimmedNextLine.startsWith("+") ||
      trimmedNextLine.startsWith("-") ||
      trimmedNextLine.startsWith("# +") ||
      trimmedNextLine.startsWith("# -")
    ) {
      snippetLines.push(nextLine);
    }
  }

  return joinLines(snippetLines);
};

export const isPageNavigationEnabled = (rulesUrls: string, url: URL): boolean => {
  const lines = splitLines(rulesUrls);
  const pattern = getWebsiteRulePattern(url);
  const startIndex = findManagedRuleStartIndex(lines, pattern);

  if (startIndex === -1) {
    return true;
  }

  return lines[startIndex]?.trim() !== `* ${pattern}`;
};

export const setPageNavigationEnabled = (
  config: Config,
  url: URL,
  enabled: boolean,
  snippet: string
): Config => {
  const lines = splitLines(config.rules.urls);
  const managedPageRule = buildManagedPageRule(url, snippet);
  const nextLines = lines.filter((line) => !isManagedRuleLine(line, managedPageRule));

  if (!enabled) {
    nextLines.unshift(...managedPageRule.lines);
  } else if (lines.some((line) => isManagedRuleLine(line, managedPageRule))) {
    nextLines.unshift(...managedPageRule.commentedLines);
  } else {
    config.rules.urls = joinLines(nextLines);

    return config;
  }

  config.rules.urls = joinLines(nextLines);
  return config;
};
