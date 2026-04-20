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

const AMAZON_TRACKING_SEARCH_PARAM_NAMES = new Set([
  "crid",
  "dib",
  "dib_tag",
  "keywords",
  "qid",
  "sprefix",
  "sr"
]);

const isTrackingSearchParam = (name: string): boolean => {
  const normalizedName = name.toLowerCase();

  return (
    TRACKING_SEARCH_PARAM_NAMES.has(normalizedName) ||
    TRACKING_SEARCH_PARAM_PREFIXES.some((prefix) => normalizedName.startsWith(prefix))
  );
};

const isAmazonTrackingSearchParam = (url: URL, name: string): boolean => {
  if (!url.hostname.endsWith("amazon.com")) return false;
  return AMAZON_TRACKING_SEARCH_PARAM_NAMES.has(name.toLowerCase());
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
    if (isTrackingSearchParam(name) || isAmazonTrackingSearchParam(url, name)) {
      url.searchParams.delete(name);
    }
  }

  return getNormalizedUrl(url.toString());
};