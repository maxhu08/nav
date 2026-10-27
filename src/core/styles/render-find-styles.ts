export type FindStyleRenderParams = {
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
  barCSS: string;
  findCSS: string;
  findHighlightBackgroundColor: string;
  findCurrentHighlightBackgroundColor: string;
  findHighlightTextColor: string;
};

export const renderFindStyles = (params: FindStyleRenderParams): string => `
:host{all:initial;position:absolute;inset:0;pointer-events:none;--nav-bar-color:${params.barOutlineColor};--nav-bar-tabs-color:${params.tabsOutlineColor};--nav-bar-width:${params.barWidth * 16}px;--nav-bar-text-size:${params.barFontSize * 16}px;--nav-bar-url-color:${params.barUrlTextColor};--nav-find-color:${params.findOutlineColor};--nav-find-width:${params.findWidth * 16}px;--nav-find-text-size:${params.findFontSize * 16}px;--nav-find-match-background:${params.findHighlightBackgroundColor};--nav-find-current-match-background:${params.findCurrentHighlightBackgroundColor};--nav-find-match-color:${params.findHighlightTextColor}}
:where(#${params.findBarId}){all:initial;--nav-prompt-width:var(--nav-find-width);--nav-prompt-text-size:var(--nav-find-text-size);--nav-prompt-color:var(--nav-find-color);--nav-prompt-font-scale:0.4;position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;pointer-events:auto;grid-template-columns:3em minmax(0,1fr) max-content;grid-template-rows:auto auto;align-items:center;column-gap:0;overflow:hidden}
:where(#${params.findBarId}:not([data-prompt-kind="find"])){--nav-prompt-width:var(--nav-bar-width);--nav-prompt-text-size:var(--nav-bar-text-size);--nav-prompt-color:var(--nav-bar-color)}
:where(#${params.findBarId}[data-prompt-kind="tabs"]){--nav-prompt-color:var(--nav-bar-tabs-color)}
@media (min-width:768px){:where(#${params.findBarId}){--nav-prompt-font-scale:0.75}}
@media (min-width:1024px){:where(#${params.findBarId}){--nav-prompt-font-scale:1}}
#${params.findBarId}[data-visible="true"]{display:grid}
:where(#${params.findStatusId}){all:initial;--nav-prompt-width:var(--nav-find-width);--nav-prompt-text-size:var(--nav-find-text-size);--nav-prompt-color:var(--nav-find-color);--nav-prompt-font-scale:1;position:fixed;right:24px;bottom:24px;z-index:2147483647;display:none;pointer-events:auto;grid-template-columns:auto max-content max-content;align-items:center}
#${params.findStatusId}[data-visible="true"]{display:grid}
:where(.nav-find-icon){all:unset;display:inline-flex;align-items:center;justify-content:center;font-size:inherit;line-height:inherit}
:where(.nav-find-icon svg){display:block}
.nav-find-icon [data-prompt-icon-kind]{display:none}
#${params.findBarId}[data-prompt-kind="find"] .nav-find-icon [data-prompt-icon-kind="find"],
#${params.findBarId}[data-prompt-kind="current-tab"] .nav-find-icon [data-prompt-icon-kind="current-tab"],
#${params.findBarId}[data-prompt-kind="new-tab"] .nav-find-icon [data-prompt-icon-kind="new-tab"],
#${params.findBarId}[data-prompt-kind="edit-current-tab"] .nav-find-icon [data-prompt-icon-kind="edit-current-tab"],
#${params.findBarId}[data-prompt-kind="tabs"] .nav-find-icon [data-prompt-icon-kind="tabs"]{display:inline-flex}
:where(#${params.findInputId}){all:unset;display:block;min-width:0;width:100%;border:0;background:transparent;font-size:inherit;line-height:inherit;outline:none;box-shadow:none;appearance:none;-webkit-appearance:none;font-family:inherit}
:where(#${params.findInputId}:focus,#${params.findInputId}:focus-visible){outline:none;box-shadow:none}
:where(#${params.findMatchCountId}){all:unset;flex:0 0 auto;display:inline-block;font-size:inherit;line-height:inherit;white-space:nowrap}
#${params.findMatchCountId}[hidden]{display:none}
:where(.nav-find-bar-actions){all:unset;display:none;align-items:center;justify-content:flex-end;align-self:stretch}
.nav-find-bar-actions[data-visible="true"]{display:inline-flex}
:where(#${params.findSuggestionsId}){all:unset;grid-column:1/-1;grid-row:2;display:none}
#${params.findSuggestionsId}[data-visible="true"]{display:grid}
:where(.nav-find-suggestion){all:unset;display:grid;grid-template-columns:3em minmax(0,1fr);align-items:center;column-gap:0;width:100%;cursor:pointer}
:where(.nav-find-suggestion-icon){display:inline-flex;align-items:center;justify-content:center;font-size:inherit;line-height:inherit}
:where(.nav-find-suggestion-icon svg){display:block}
:where(.nav-find-suggestion-value){display:block;min-width:0;font-size:inherit;line-height:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:where(#${params.findStatusTextId}){all:unset;display:inline-flex;align-items:center;gap:0}
:where(.nav-find-nav){all:unset;display:grid;place-items:center;cursor:pointer}
:where(.nav-find-nav:disabled){cursor:default}
:where(.nav-find-nav svg){display:block}
:where(#${params.findBarId} *,#${params.findStatusId} *){box-sizing:border-box}
:where(#${params.findInputId},#${params.findMatchCountId},#${params.findSuggestionsId},#${params.findStatusTextId}){box-sizing:content-box}
@scope (#${params.findBarId}:not([data-prompt-kind="find"])) {
${params.barCSS}
}
@scope (#${params.findBarId}[data-prompt-kind="find"], #${params.findStatusId}) {
${params.findCSS}
}
`;

export const renderFindHighlightStyles = (params: FindStyleRenderParams): string => `
::highlight(${params.findHighlightName}){background-color:${params.findHighlightBackgroundColor};color:${params.findHighlightTextColor}}
::highlight(${params.findCurrentHighlightName}){background-color:${params.findCurrentHighlightBackgroundColor};color:${params.findHighlightTextColor}}
`;