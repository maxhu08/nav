export type SpatialIndex = Map<number, Map<number, number[]>>;

export type HintCollectionContext = {
  getRect: (element: HTMLElement) => DOMRect | null;
  getIdentity: (element: HTMLElement) => string | null;
  getDepth: (element: HTMLElement) => number;
  getPreference: (element: HTMLElement) => number;
};

export type GetRect = HintCollectionContext["getRect"];
export type GetIdentity = HintCollectionContext["getIdentity"];
export type GetPreference = HintCollectionContext["getPreference"];