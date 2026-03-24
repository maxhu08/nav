const TRACKING_SEARCH_PARAM_NAMES = new Set([
  "_hsenc",
  "_hsmi",
  "dclid",
  "fbclid",
  "gbraid",
  "gclid",
  "hsctatracking",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "msclkid",
  "si",
  "srsltid",
  "ttclid",
  "twclid",
  "vero_conv",
  "vero_id",
  "wbraid",
  "yclid"
]);

const TRACKING_SEARCH_PARAM_PREFIXES = [
  "ga_",
  "hsa_",
  "hs_",
  "mc_",
  "mkt_",
  "pk_",
  "utm_",
  "vero_"
];

const isTrackingSearchParam = (name: string): boolean => {
  const normalizedName = name.toLowerCase();

  return (
    TRACKING_SEARCH_PARAM_NAMES.has(normalizedName) ||
    TRACKING_SEARCH_PARAM_PREFIXES.some((prefix) => normalizedName.startsWith(prefix))
  );
};

export const getNormalizedUrl = (value: string): string => {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

  return `${url.origin}${pathname}${url.search}${url.hash}`;
};

export const getBaseUrl = (value: string): string => {
  const url = new URL(value);
  return url.origin;
};

export const getCleanUrl = (value: string): string => {
  const url = new URL(value);

  for (const name of Array.from(url.searchParams.keys())) {
    if (isTrackingSearchParam(name)) {
      url.searchParams.delete(name);
    }
  }

  return getNormalizedUrl(url.toString());
};