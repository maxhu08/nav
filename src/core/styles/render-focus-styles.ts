export type FocusStyleRenderParams = {
  overlayId: string;
  overlayPositionStyleId: string;
  fadeOutMs: number;
  durationMs: number;
  activationIndicatorColor: string;
  colorToRgba: (color: string, alpha: number) => string;
};

export const renderFocusStyles = (params: FocusStyleRenderParams): string => {
  return `@keyframes nav-focus-pulse{0%{opacity:1;box-shadow:0 0 0 10px ${params.colorToRgba(params.activationIndicatorColor, 0.32)},0 0 0 4px ${params.colorToRgba(params.activationIndicatorColor, 0.9)}}70%{opacity:1;box-shadow:0 0 0 4px ${params.colorToRgba(params.activationIndicatorColor, 0.08)},0 0 0 2px ${params.colorToRgba(params.activationIndicatorColor, 0.72)}}100%{opacity:0;box-shadow:0 0 0 2px ${params.colorToRgba(params.activationIndicatorColor, 0.02)},0 0 0 1px ${params.colorToRgba(params.activationIndicatorColor, 0)}}}#${params.overlayId}{position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483646;border-radius:.35rem;box-sizing:border-box;opacity:0;visibility:hidden;transform:none!important;transition:none!important;transition-duration:0ms!important;transition-property:none!important}#${params.overlayId}[data-visible="true"]{visibility:visible;opacity:1}#${params.overlayId}[data-hiding="true"]{visibility:visible;opacity:0;transition:opacity ${params.fadeOutMs}ms ease-out!important}#${params.overlayId}[data-animate="true"]{animation:nav-focus-pulse ${params.durationMs}ms cubic-bezier(.2,.9,.2,1)!important}`;
};