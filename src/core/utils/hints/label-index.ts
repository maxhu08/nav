import type { HintLabelIndex, HintMarker } from "~/src/core/utils/hints/types";

type LabelTrieNode = {
  children: Map<string, LabelTrieNode>;
  markers: HintMarker[];
  exact: HintMarker | null;
};

const createTrieNode = (): LabelTrieNode => ({
  children: new Map(),
  markers: [],
  exact: null
});

const EMPTY_MARKERS: HintMarker[] = [];

export const buildHintLabelIndex = (markers: HintMarker[]): HintLabelIndex => {
  const root = createTrieNode();
  root.markers = markers;

  const exactByLabel = new Map<string, HintMarker>();
  const prefixCache = new Map<string, HintMarker[]>();
  prefixCache.set("", markers);

  for (const marker of markers) {
    exactByLabel.set(marker.label, marker);

    let node = root;
    for (const char of marker.label) {
      let nextNode = node.children.get(char);
      if (!nextNode) {
        nextNode = createTrieNode();
        node.children.set(char, nextNode);
      }

      nextNode.markers.push(marker);
      node = nextNode;
    }

    node.exact = marker;
  }

  const resolvePrefixNode = (prefix: string): LabelTrieNode | null => {
    let node: LabelTrieNode | null = root;

    for (const char of prefix) {
      node = node.children.get(char) ?? null;
      if (!node) {
        return null;
      }
    }

    return node;
  };

  const getByPrefix = (prefix: string): HintMarker[] => {
    const cached = prefixCache.get(prefix);
    if (cached) {
      return cached;
    }

    const node = resolvePrefixNode(prefix);
    if (!node) {
      prefixCache.set(prefix, EMPTY_MARKERS);
      return EMPTY_MARKERS;
    }

    prefixCache.set(prefix, node.markers);
    return node.markers;
  };

  return {
    getByPrefix,
    hasPrefix: (prefix: string): boolean => getByPrefix(prefix).length > 0,
    getExact: (label: string): HintMarker | undefined => exactByLabel.get(label)
  };
};