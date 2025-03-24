import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";
import { markPageElements, ElementMarker } from "./mark";

// 全局变量：共享的浏览器和页面实例
let browserInstance: Browser | null;
let pageInstance: Page | null;
// 全局变量：页面中的标记
let markers: ElementMarker[] = [];
let screenshot: string;

export async function POST(request: Request) {
  try {
    const body = await request.json(); // 获取请求体中的操作指令
    const {
      url = "",
      actions = [],
      reset,
    } = body as {
      url?: string;
      actions?: string[];
      reset?: boolean;
    };

    if (reset) {
      browserInstance = null;
      pageInstance = null;
      markers = [];
      screenshot = "";

      return {
        status: 200,
        body: "reset",
      };
    }

    // 初始化浏览器实例，并支持重启
    if (!browserInstance || !pageInstance) {

      // 当前存在浏览器实例，等待关闭
      if (browserInstance) {
        await browserInstance.close();
      }

      // 启动浏览器实例
      browserInstance = await puppeteer.launch({
        headless: true,
        args: ["--disable-web-security"],
        defaultViewport: { width: 1920, height: 1080 },
      });

      // 创建浏览器页面实例
      pageInstance = await browserInstance.newPage();

      // 打开目标页面
      if (url) {
        await pageInstance.goto(url, { waitUntil: "networkidle2" });
      }
    }

    const findIndex = (str: string) => {
      return Number(str.replace("[", "").replace("]", ""));
    };

    // 执行用户操作
    for (const action of actions) {
      /**
       * 主要支持的几种用户操作
       * Click [2]
       * Type [2]; Baked Salmon
       * Scroll [WINDOW]; down
       * ANSWER; The \"Baked Dijon Salmon\" recipe meets the user's criteria, with a 4.6-star rating and a preparation time of 15 minutes.
       */
      // 处于最终回答情况
      if (action?.startsWith("ANSWER")) {
        break;
      }
      // 模拟点击行为
      else if (action?.startsWith("Click")) {
        const target = findIndex(action.split(" ")?.[1] || "[0]");
        // 找到指定操作元素
        const elementMarker = markers[target];
       
        // 进行对象元素的点击操作
        await pageInstance.click(elementMarker.selector);
      }
      // 模拟打字行为
      else if (action?.startsWith("Type")) {
        const content = action.split("; ")[1];
        const target = findIndex(
          action.split("; ")[0]?.split(" ")?.[1] || "[0]"
        );
        // 找到指定操作元素
        const elementMarker = markers[target];
        await pageInstance.type(elementMarker.selector, content);
      }
      // 模拟滚动场景
      else if (action?.startsWith("Scroll")) {
        // const direction = action.split("; ")?.[1];
        await pageInstance.evaluate(() =>
          window.scrollBy(0, window.innerHeight)
        );
      }

      // 等待一段时间以观察效果
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // 进行页面标签标记和截图
    try {
      // 添加元素标注
      markers = await markPageElements(pageInstance);
      // 等待标注渲染
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 执行截图
      screenshot = await pageInstance.screenshot({
        type: "png",
        encoding: "base64",
      });
    } finally {
      // 清理标注元素
      await pageInstance.evaluate(() => {
        const markers = document.querySelectorAll(
          '[style*="z-index: 2147483647"]'
        );
        markers.forEach((marker) => marker.remove());
      });
    }

    // 获取更新后的页面 HTML 并转换相对路径为绝对路径
    const html = await pageInstance.evaluate(() => {
      // 相对路径转换为绝对路径
      function toAbsoluteUrl(relativeUrl: string): string {
        const a = document.createElement("a");
        // 浏览器自动解析为绝对路径
        a.href = relativeUrl;
        return a.href;
      }

      // 处理图片
      Array.from(document.querySelectorAll("img")).forEach((img) => {
        const src = img.getAttribute("src");
        if (src) img.setAttribute("src", toAbsoluteUrl(src));

        const srcset = img.getAttribute("srcset");
        if (srcset) {
          const updatedSrcset = srcset
            .split(",")
            .map((entry) => {
              const [url, descriptor] = entry.trim().split(/\s+/);
              return `${toAbsoluteUrl(url)} ${descriptor || ""}`.trim();
            })
            .join(", ");
          img.setAttribute("srcset", updatedSrcset);
        }
      });

      // 处理样式表
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(
        (link) => {
          const href = link.getAttribute("href");
          if (href) link.setAttribute("href", toAbsoluteUrl(href));
        }
      );

      // 处理动态插入的样式
      Array.from(document.querySelectorAll("style")).forEach((style) => {
        const cssText = style.innerHTML;
        if (cssText) {
          const styleElement = document.createElement("style");
          styleElement.innerHTML = cssText;
          document.head.appendChild(styleElement);
        }
      });

      // 处理脚本
      Array.from(document.querySelectorAll("script[src]")).forEach((script) => {
        const src = script.getAttribute("src");
        if (src) script.setAttribute("src", toAbsoluteUrl(src));
      });

      // 处理预加载资源（新增部分）
      Array.from(document.querySelectorAll('link[rel="preload"]')).forEach(
        (link) => {
          const href = link.getAttribute("href");
          if (href) link.setAttribute("href", toAbsoluteUrl(href));
        }
      );

      // 处理字体文件
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(
        (link) => {
          const href = link.getAttribute("href");
          if (href) link.setAttribute("href", toAbsoluteUrl(href));
        }
      );
      // 处理@font-face中的URL（通过正则替换）
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from((sheet as CSSStyleSheet).cssRules);
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              rule.style.cssText = rule.style.cssText.replace(
                /url\(['"]?(.*?)['"]?\)/g,
                (match, p1) => `url("${toAbsoluteUrl(p1)}")`
              );
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }

      // 返回修改后的 HTML
      return document.documentElement.outerHTML;
    });
    // 更新当前页面的 URL
    const currentUrl = pageInstance.url();

    return NextResponse.json({ html, currentUrl, screenshot, markers });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
