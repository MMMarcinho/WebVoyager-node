import { Page } from "puppeteer";

export interface ElementMarker {
  selector: string;
  index: number;
  content: string;
  label: string;
}

export async function markPageElements(page: Page): Promise<ElementMarker[]> {
  return page.evaluate((): ElementMarker[] => {
    const markers: ElementMarker[] = [];

    function buildMarkerSelector(element: HTMLElement) {
      const path = [];
      while (element.parentElement) {
        let selectorPart = element.tagName.toLowerCase();

        // 如果有id，则直接使用id作为选择器的一部分
        if (element.id) {
          selectorPart += `#${element.id}`;
          path.unshift(selectorPart);
          break; // ID应该是唯一的，因此可以直接退出循环
        } else {
          // 添加类名以增加特异性
          if (element.classList.length > 0) {
            selectorPart += "." + Array.from(element.classList).join(".");
          }

          // 如果没有ID也没有类名，尝试使用:nth-child()伪类
          const siblings = element.parentNode
            ? Array.from(element.parentNode.children)
            : [];
          const index =
            siblings.findIndex((sibling) => sibling === element) + 1;
          if (index > 1 || !element.classList.length) {
            // 如果不是第一个子元素或没有类名，则添加:nth-child()
            selectorPart += `:nth-child(${index})`;
          }
        }

        path.unshift(selectorPart);
        element = element.parentElement;
      }
      return path.join(" > ");
    }

    const interactiveSelectors = [
      "button",
      "a",
      "input",
      "textarea",
      "select",
      '[role="button"]',
      "[onclick]",
      "[href]",
    ];
    // 获取所有可交互元素
    const elements = Array.from(
      document.querySelectorAll(interactiveSelectors.join(","))
    )
      .filter((el): el is HTMLElement => {
        const rect = el.getBoundingClientRect();
        return rect.width > 20 && rect.height > 20;
      })
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top || rectA.left - rectB.left;
      });
    // 创建标注元素
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const marker = document.createElement("div");
      marker.style.position = "absolute";
      marker.style.zIndex = "2147483647";
      marker.style.pointerEvents = "none";
      marker.style.border = "2px dashed #FF0000";
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      marker.style.top = `${rect.top + window.scrollY}px`;
      marker.style.left = `${rect.left + window.scrollX}px`;
      const label = document.createElement("div");
      label.textContent = `${index}`;
      label.style.position = "absolute";
      label.style.top = "-24px";
      label.style.left = "0";
      label.style.background = "#FF0000";
      label.style.color = "white";
      label.style.padding = "2px 8px";
      label.style.borderRadius = "4px";
      label.style.fontSize = "14px";
      marker.appendChild(label);
      document.body.appendChild(marker);

      let content = "";
      if (
        el.tagName.toLowerCase() === "input" ||
        el.tagName.toLowerCase() === "textarea"
      ) {
        content =
          (el as HTMLInputElement | HTMLTextAreaElement).value.trim() ||
          (el as HTMLInputElement | HTMLTextAreaElement).placeholder.trim();
      } else {
        content = el.textContent || "";
      }

      markers.push({
        selector: buildMarkerSelector(el),
        index: index,
        content: content.trim(),
        label: el.tagName.toLowerCase(),
      });
    });
    return markers;
  });
}
