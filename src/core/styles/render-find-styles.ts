export type FindStyleRenderParams = {
  findOverlayId: string;
  findBarId: string;
  findStatusId: string;
  findInputId: string;
  findMatchCountId: string;
  findSuggestionsId: string;
  findStatusTextId: string;
  findHighlightName: string;
  findCurrentHighlightName: string;
  barOutlineColor: string;
  tabsOutlineColor: string;
  findOutlineColor: string;
  barWidth: number;
  barFontSize: number;
  findWidth: number;
  findFontSize: number;
  barUrlTextColor: string;
  findHighlightBackgroundColor: string;
  findCurrentHighlightBackgroundColor: string;
  findHighlightTextColor: string;
};

export const renderFindStyles = (params: FindStyleRenderParams): string => {
  return `
#${params.findOverlayId}{all:initial;position:absolute;inset:0;pointer-events:none}
#${params.findBarId}{all:initial;--nav-prompt-width:${params.findWidth * 16}px;--nav-prompt-font-size:${params.findFontSize * 16}px;--nav-prompt-font-scale:0.4;position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;pointer-events:auto;width:min(var(--nav-prompt-width),calc(100vw - 32px));grid-template-columns:3em minmax(0,1fr) max-content;grid-template-rows:auto auto;align-items:center;column-gap:0;border:2px solid ${params.findOutlineColor};border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:calc(var(--nav-prompt-font-size) * var(--nav-prompt-font-scale));line-height:1.333333;overflow:hidden}
#${params.findBarId}:not([data-prompt-kind="find"]){--nav-prompt-width:${params.barWidth * 16}px;--nav-prompt-font-size:${params.barFontSize * 16}px}
@media (min-width:768px){#${params.findBarId}{--nav-prompt-font-scale:0.75}}
@media (min-width:1024px){#${params.findBarId}{--nav-prompt-font-scale:1}}
#${params.findBarId}[data-visible="true"]{display:grid}
#${params.findBarId}[data-prompt-kind="current-tab"],#${params.findBarId}[data-prompt-kind="new-tab"],#${params.findBarId}[data-prompt-kind="edit-current-tab"]{border-color:${params.barOutlineColor}}
#${params.findBarId}[data-prompt-kind="tabs"]{border-color:${params.tabsOutlineColor}}
#${params.findStatusId}{all:initial;position:fixed;right:24px;bottom:24px;z-index:2147483647;display:none;pointer-events:auto;grid-template-columns:auto max-content max-content;align-items:center;gap:.5rem;padding:10px 12px;border:2px solid ${params.findOutlineColor};border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:20px;line-height:28px}
#${params.findStatusId}[data-visible="true"]{display:grid}
#${params.findBarId} *,#${params.findStatusId} *{box-sizing:border-box}
#${params.findBarId}::selection,#${params.findStatusId}::selection,#${params.findBarId} *::selection,#${params.findStatusId} *::selection{background:#ffffff20!important;background-color:#ffffff20!important;color:inherit!important}
.nav-find-icon{all:unset;display:inline-flex;align-items:center;justify-content:center;width:3em;height:2.333333em;color:#a1a1aa;font-size:inherit;line-height:inherit}
.nav-find-icon svg{width:1em;height:1em;display:block}
.nav-find-icon [data-prompt-icon-kind]{display:none}
#${params.findBarId}[data-prompt-kind="find"] .nav-find-icon [data-prompt-icon-kind="find"]{display:inline-flex}
#${params.findBarId}[data-prompt-kind="current-tab"] .nav-find-icon [data-prompt-icon-kind="current-tab"]{display:inline-flex}
#${params.findBarId}[data-prompt-kind="new-tab"] .nav-find-icon [data-prompt-icon-kind="new-tab"]{display:inline-flex}
#${params.findBarId}[data-prompt-kind="edit-current-tab"] .nav-find-icon [data-prompt-icon-kind="edit-current-tab"]{display:inline-flex}
#${params.findBarId}[data-prompt-kind="tabs"] .nav-find-icon [data-prompt-icon-kind="tabs"]{display:inline-flex}
#${params.findInputId}{all:unset;display:block;min-width:0;width:100%;border:0;background:transparent;color:#fafafa;font-size:inherit;line-height:inherit;outline:none;box-shadow:none;appearance:none;-webkit-appearance:none;font-family:inherit;padding:.5em 0}
#${params.findInputId}[data-url-like="true"]{color:${params.barUrlTextColor}}
#${params.findInputId}:focus,#${params.findInputId}:focus-visible{outline:none;box-shadow:none}
#${params.findInputId}::placeholder{color:#a1a1aa}
#${params.findMatchCountId}{all:unset;flex:0 0 auto;display:inline-block;color:#a1a1aa;font-size:inherit;line-height:inherit;white-space:nowrap;padding-left:.166667em}
#${params.findMatchCountId}[hidden]{display:none}
.nav-find-bar-actions{all:unset;display:none;align-items:center;justify-content:flex-end;align-self:stretch;gap:.333333em;height:2.333333em;padding:0 .5em}
.nav-find-bar-actions[data-visible="true"]{display:inline-flex}
#${params.findSuggestionsId}{all:unset;grid-column:1/-1;grid-row:2;display:none;padding-top:.166667em}
#${params.findSuggestionsId}[data-visible="true"]{display:grid}
.nav-find-suggestion{all:unset;display:grid;grid-template-columns:3em minmax(0,1fr);align-items:center;column-gap:0;width:100%;color:#a1a1aa;cursor:pointer}
.nav-find-suggestion:hover,.nav-find-suggestion[data-selected="true"]{background:rgba(255,255,255,.08)}
.nav-find-suggestion:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.nav-find-suggestion-icon{display:inline-flex;align-items:center;justify-content:center;width:3em;height:2.333333em;color:#a1a1aa;font-size:inherit;line-height:inherit}
.nav-find-suggestion-icon svg{width:1em;height:1em;display:block}
.nav-find-suggestion-value{display:block;min-width:0;font-size:inherit;line-height:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:.5em .5em .5em 0}
.nav-find-suggestion-char{color:#737373}
.nav-find-suggestion-char[data-match="true"]{color:#fafafa}
.nav-find-suggestion[data-direct-link="true"] .nav-find-suggestion-char[data-match="true"]{color:${params.barUrlTextColor}}
#${params.findStatusTextId}{all:unset;display:inline-flex;align-items:center;gap:0;color:#fafafa;font-size:20px;line-height:28px}
.nav-find-status-number{color:#fafafa}
.nav-find-status-separator{color:#a1a1aa}
.nav-find-nav{all:unset;display:grid;place-items:center;width:36px;height:36px;border-radius:.4rem;color:#fafafa;cursor:pointer;transition:background-color .15s ease,color .15s ease,opacity .15s ease}
.nav-find-nav:hover:not(:disabled){background:rgba(255,255,255,.08)}
.nav-find-nav:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.nav-find-nav:disabled{opacity:.35;cursor:default}
.nav-find-nav svg{width:18px;height:18px;display:block}
.nav-find-clear{width:1.5em;height:1.5em;border-radius:.266667em}
.nav-find-clear svg{width:1em;height:1em}
::highlight(${params.findHighlightName}){background-color:${params.findHighlightBackgroundColor};color:${params.findHighlightTextColor}}
::highlight(${params.findCurrentHighlightName}){background-color:${params.findCurrentHighlightBackgroundColor};color:${params.findHighlightTextColor}}
`;
};