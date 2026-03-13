type TooltipOptions = {
  content: string;
  placement?: "top";
};

const TOOLTIP_OFFSET_PX = 10;

const getTooltipEl = (): HTMLDivElement => {
  let tooltipEl = document.getElementById("options-tooltip") as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = "options-tooltip";
    tooltipEl.className = "options-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipEl.setAttribute("data-state", "hidden");
    document.body.append(tooltipEl);
  }

  return tooltipEl;
};

const positionTooltip = (target: HTMLElement, tooltipEl: HTMLDivElement): void => {
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  const top = rect.top - tooltipRect.height - TOOLTIP_OFFSET_PX;

  tooltipEl.style.left = `${Math.max(8, left)}px`;
  tooltipEl.style.top = `${Math.max(8, top)}px`;
};

export const tippy = (selector: string, { content }: TooltipOptions): void => {
  const tooltipEl = getTooltipEl();

  document.querySelectorAll<HTMLElement>(selector).forEach((target) => {
    const show = () => {
      tooltipEl.textContent = content;
      tooltipEl.setAttribute("data-state", "hidden");
      tooltipEl.style.left = "0px";
      tooltipEl.style.top = "0px";
      positionTooltip(target, tooltipEl);
      tooltipEl.setAttribute("data-state", "visible");
    };

    const hide = () => {
      tooltipEl.setAttribute("data-state", "hidden");
    };

    target.addEventListener("mouseenter", show);
    target.addEventListener("focus", show);
    target.addEventListener("mouseleave", hide);
    target.addEventListener("blur", hide);
  });
};