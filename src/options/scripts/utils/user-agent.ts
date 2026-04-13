export const getUserAgent = () => {
  if (navigator.userAgent.indexOf("Chrome") !== -1) return "chrome";
  if (navigator.userAgent.indexOf("Firefox") !== -1) return "firefox";
  return "unknown";
};