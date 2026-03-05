export type FindStyleRenderParams = {
  findBarId: string;
  findStatusId: string;
  findInputId: string;
  findMatchCountId: string;
  findStatusTextId: string;
  findHighlightName: string;
  findCurrentHighlightName: string;
};

export const renderFindStyles = (params: FindStyleRenderParams): string => {
  const {
    findBarId,
    findStatusId,
    findInputId,
    findMatchCountId,
    findStatusTextId,
    findHighlightName,
    findCurrentHighlightName
  } = params;

  return `#${findBarId}{all:initial;position:fixed;top:20%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:none;pointer-events:auto;width:min(640px,calc(100vw - 32px));grid-template-columns:max-content auto max-content;align-items:center;gap:0;padding:10px 12px;border:2px solid #eab308;border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",monospace;font-size:24px;line-height:32px}#${findBarId}[data-visible="true"]{display:grid}#${findBarId} *,#${findStatusId} *{box-sizing:border-box}.nav-find-icon{all:unset;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;color:#a1a1aa;font-size:24px;line-height:32px;margin-right:.25rem}.nav-find-icon svg{width:1em;height:1em;display:block}#${findInputId}{all:unset;flex:1 1 auto;display:block;min-width:0;border:0;background:transparent;color:#fafafa;font-size:24px;line-height:32px;outline:none;box-shadow:none;appearance:none;-webkit-appearance:none;font-family:inherit;padding-right:.25rem}#${findInputId}:focus,#${findInputId}:focus-visible{outline:none;box-shadow:none}#${findInputId}::placeholder{color:#a1a1aa}#${findMatchCountId}{all:unset;flex:0 0 auto;display:inline-block;color:#a1a1aa;font-size:24px;line-height:32px;white-space:nowrap;padding-left:.25rem}.nav-find-bar-actions{all:unset;display:none;align-items:center;gap:.5rem;padding-left:.25rem}.nav-find-bar-actions[data-visible="true"]{display:inline-flex}#${findStatusId}{all:initial;position:fixed;right:24px;bottom:24px;z-index:2147483647;display:none;pointer-events:auto;grid-auto-flow:column;align-items:center;gap:.5rem;padding:10px 12px;border:2px solid #eab308;border-radius:.5rem;background:#171717;box-shadow:0 20px 40px rgba(0,0,0,.35);color:#f5f5f5;font-family:"JetBrains Mono",monospace;font-size:24px;line-height:32px}#${findStatusId}[data-visible="true"]{display:grid}#${findStatusTextId}{all:unset;display:inline-block;min-width:52px;font-size:24px;line-height:32px;text-align:center;padding:0 .25rem}.nav-find-status-number{color:#fafafa}.nav-find-status-separator{color:#a1a1aa}.nav-find-nav,.nav-find-clear{all:unset;position:relative;display:grid;align-items:center;justify-content:center;width:1.5em;height:1.5em;padding:0;border:0;border-radius:.375rem;background:transparent;color:#a1a1aa;cursor:pointer;transition:background-color 250ms ease,color 250ms ease;font-size:24px;line-height:32px;outline:none;box-shadow:none;appearance:none;-webkit-appearance:none}.nav-find-nav::before,.nav-find-clear::before{content:"";position:absolute;inset:0;border-radius:.375rem;background:rgba(255,255,255,.12);opacity:0;pointer-events:none;transition:opacity 250ms ease}.nav-find-nav:hover:not(:disabled)::before,.nav-find-nav:focus-visible:not(:disabled)::before,.nav-find-clear:hover:not(:disabled)::before,.nav-find-clear:focus-visible:not(:disabled)::before{opacity:1}.nav-find-nav:disabled,.nav-find-clear:disabled{cursor:default;opacity:.35;color:#737373}.nav-find-nav svg,.nav-find-clear svg{width:1em;height:1em;display:block;position:relative;z-index:1}.nav-find-nav:focus,.nav-find-nav:focus-visible,.nav-find-clear:focus,.nav-find-clear:focus-visible{outline:none;box-shadow:none}::highlight(${findHighlightName}){background:rgba(234,179,8,.18);color:inherit}::highlight(${findCurrentHighlightName}){background:rgba(234,179,8,.82);color:#111111}`;
};
