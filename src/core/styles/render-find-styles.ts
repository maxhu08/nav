export type FindStyleRenderParams = {
  findOverlayId: string;
  findBarId: string;
  findStatusId: string;
  findInputId: string;
  findMatchCountId: string;
  findStatusTextId: string;
  findHighlightName: string;
  findCurrentHighlightName: string;
  findHighlightBackgroundColor: string;
  findCurrentHighlightBackgroundColor: string;
  findHighlightTextColor: string;
};

export const renderFindStyles = (params: FindStyleRenderParams): string => {
  const {
    findOverlayId,
    findBarId,
    findStatusId,
    findInputId,
    findMatchCountId,
    findStatusTextId,
    findHighlightName,
    findCurrentHighlightName,
    findHighlightBackgroundColor,
    findCurrentHighlightBackgroundColor,
    findHighlightTextColor
  } = params;

  return `
#${findOverlayId}{all:initial;position:absolute;inset:0;pointer-events:none}
#${findBarId}{all:initial;position:fixed;top:20%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:none;pointer-events:auto;width:min(640px,calc(100vw - 32px));grid-template-columns:max-content auto max-content;align-items:center;gap:0;padding:10px 12px;border:2px solid #eab308;border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:24px;line-height:32px}
#${findBarId}[data-visible="true"]{display:grid}
#${findStatusId}{all:initial;position:fixed;right:24px;bottom:24px;z-index:2147483647;display:none;pointer-events:auto;grid-auto-flow:column;align-items:center;gap:.5rem;padding:10px 12px;border:2px solid #eab308;border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:20px;line-height:28px}
#${findStatusId}[data-visible="true"]{display:grid}
#${findBarId} *,#${findStatusId} *{box-sizing:border-box}
#${findBarId}::selection,#${findStatusId}::selection,#${findBarId} *::selection,#${findStatusId} *::selection{background:#ffffff20!important;background-color:#ffffff20!important;color:inherit!important}
.nav-find-icon{all:unset;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;color:#a1a1aa;font-size:24px;line-height:32px;margin-right:.25rem}
.nav-find-icon svg{width:1em;height:1em;display:block}
#${findInputId}{all:unset;flex:1 1 auto;display:block;min-width:0;border:0;background:transparent;color:#fafafa;font-size:24px;line-height:32px;outline:none;box-shadow:none;appearance:none;-webkit-appearance:none;font-family:inherit;padding-right:.25rem}
#${findInputId}:focus,#${findInputId}:focus-visible{outline:none;box-shadow:none}
#${findInputId}::placeholder{color:#a1a1aa}
#${findMatchCountId}{all:unset;flex:0 0 auto;display:inline-block;color:#a1a1aa;font-size:24px;line-height:32px;white-space:nowrap;padding-left:.25rem}
.nav-find-bar-actions{all:unset;display:none;align-items:center;gap:.5rem;padding-left:.25rem}
.nav-find-bar-actions[data-visible="true"]{display:inline-flex}
#${findStatusTextId}{all:unset;display:inline-flex;align-items:center;gap:0;color:#fafafa;font-size:20px;line-height:28px}
.nav-find-status-number{color:#fafafa}
.nav-find-status-separator{color:#a1a1aa}
.nav-find-nav{all:unset;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:.4rem;color:#fafafa;cursor:pointer;transition:background-color .15s ease,color .15s ease,opacity .15s ease}
.nav-find-nav:hover:not(:disabled){background:rgba(255,255,255,.08)}
.nav-find-nav:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.nav-find-nav:disabled{opacity:.35;cursor:default}
.nav-find-nav svg{width:18px;height:18px;display:block}
::highlight(${findHighlightName}){background-color:${findHighlightBackgroundColor};color:${findHighlightTextColor}}
::highlight(${findCurrentHighlightName}){background-color:${findCurrentHighlightBackgroundColor};color:${findHighlightTextColor}}
`;
};