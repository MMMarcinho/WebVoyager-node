"use client";
import { useState, useEffect } from "react";
import OpenAI from "openai";
import { Space, Input } from "antd";
import Image from "next/image";
import { callLLM } from "../../services";
import { PROMPT_WEB_VOYAGER } from "../../prompts";
import { ISteps } from "../Steps";

export interface ElementMarker {
  selector: string;
  index: number;
  content: string;
  label: string;
}

interface ApiResponse {
  html: string;
  screenshot: string;
  currentUrl: string;
  markers: ElementMarker[];
}

export enum PageType {
  HTML = "html",
  SCREENSHOT = "screenshot",
}

export type PageTag = {
  index: number;
  label?: string;
  content: string;
};

export const Puppeteer = ({
  userInput,
  onAddSteps,
}: {
  userInput?: string;
  onAddSteps?: (e: ISteps[]) => void;
}) => {
  // 页面 html 内容
  const [pageContent, setPageContent] = useState<string>("");
  // 页面截图
  const [pageScreenshot, setPageScreenshot] = useState<string>("");
  // 展示内容类型
  const [pageSwitch, setPageSwitch] = useState<PageType>(PageType.SCREENSHOT);
  // 用户需求
  const [input, setInput] = useState<string>(
    "Find the Birthday of Cristiano Ronaldo"
  );
  // 操作队列
  const [actions, setActions] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>(
    "https://www.baidu.com/"
  );
  // 消息队列
  const [messages, setMessages] = useState<
    OpenAI.Chat.ChatCompletionMessageParam[]
  >([]);

  const handlePerformActions = async (reset: boolean = false) => {
    const response = await fetch("/api/puppeteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl, actions, reset }),
    });
    const data: ApiResponse = await response.json();

    if (data.html) {
      setPageContent(data.html); // 更新页面内容
      setPageScreenshot(`data:image/png;base64,${data.screenshot}`); // 更新页面截图
      setCurrentUrl(data.currentUrl); // 更新当前 URL
    }
  };

  const handleReset = () => {
    setActions([]); // 清空操作队列
    handlePerformActions(true); // 触发重置
  };

  useEffect(() => {
    if (userInput) {
      console.log("update user input", userInput);
      setInput(userInput);
    }
  }, [userInput]);

  // 操作页面（执行页面截图+执行操作）
  const operatePage = async (actions?: string[]) => {
    const params = { url: currentUrl, actions: actions?.filter(Boolean) };

    const response = await fetch("/api/puppeteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data: ApiResponse = await response.json();
    // 更新页面 html 内容
    setPageContent(data.html);
    // 更新页面 base64 截图
    setPageScreenshot(`data:image/png;base64,${data.screenshot}`);
    // 更新当前 URL
    setCurrentUrl(data.currentUrl);

    return data;
  };

  // 进行任务的初始化
  const initTask = async () => {
    const pageData = await operatePage();
    const { currentUrl, screenshot, markers } = pageData || {};
    const pageTypeStr = markers
      .map((tag) => `[${tag.index}]: ${tag.label || ""} \"${tag.content}\"`)
      .join("; ");
    const msg = [
      {
        role: "system" as const,
        content: PROMPT_WEB_VOYAGER,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `Now given a task: ${input}  Please interact with ${currentUrl} and get the answer. Observation: please analyze the attached screenshot and give the Thought and Action. I've provided the tag name of each element and the text it contains (if text exists). Note that <textarea> or <input> may be textbox, but not exactly. Please focus more on the screenshot and then refer to the textual information.\n ${pageTypeStr}`,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: screenshot?.startsWith("data:image")
                ? screenshot
                : `data:image/png;base64,${screenshot}`,
            },
          },
        ],
      },
    ];
    console.log("pageData ======", pageData, "\n", pageTypeStr);
    setMessages(msg);
    const res = await callLLM(msg);
    // const res = `Thought: The task is to find the birthday of Cristiano Ronaldo. I need to use the search bar to input the query. Action: Type [4]; Cristiano Ronaldo birthday`;
    handleTaskResult([
      ...msg,
      {
        role: "assistant" as const,
        content: res,
      },
    ]);
  };

  // 继续执行下一步任务
  const resumeTask = async () => {
    const pageData = await operatePage(actions);
    const { screenshot, markers } = pageData || {};
    const pageTypeStr = markers
      .map((tag) => `[${tag.index}]: ${tag.label || ""} \"${tag.content}\"`)
      .join("; ");
    const msg = [
      ...messages,
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `Observation: please analyze the attached screenshot and give the Thought and Action. I've provided the tag name of each element and the text it contains (if text exists). Note that <textarea> or <input> may be textbox, but not exactly. Please focus more on the screenshot and then refer to the textual information.\n ${pageTypeStr}`,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: screenshot?.startsWith("data:image")
                ? screenshot
                : `data:image/png;base64,${screenshot}`,
            },
          },
        ],
      },
    ];
    const res = await callLLM(msg);
    // const res = `Thought: The search query has been entered, now I need to click the search button to get the results. Action: Click [8] `
    handleTaskResult([
      ...msg,
      {
        role: "assistant" as const,
        content: res,
      },
    ]);
  };

  // 处理每次任务返回的结果
  const handleTaskResult = async (
    msg: OpenAI.Chat.ChatCompletionMessageParam[]
  ) => {
    // Thought: The task is to interact with the Google search page, which typically involves using the search box to input a query. The search box is labeled with [4].\nAction: Click [4]
    const data = msg.findLast((it) => it.role === "assistant")?.content || "";
    setMessages(msg);
    console.log("handleTaskResult=======", data, msg);
    if (typeof data === "string") {
      const action = data.split("Action:")?.[1]?.trim();
      const thought = data.split("Action:")?.[0]?.replace("Thought: ", "");
      onAddSteps?.([{ think: thought, action }]);
      if (action) {
        setActions([action]);
      }
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {!!actions.length && (
        <Space direction="horizontal">
          <>Next Action:</>
          <Input
            value={actions[actions.length - 1]}
            onChange={(e) => setActions([e.target.value])}
          />
        </Space>
      )}
      {/* 页面展示区域 */}
      {pageSwitch === PageType.SCREENSHOT && pageScreenshot && (
        <Image
          src={pageScreenshot}
          style={{
            width: "70vw",
            height: "auto",
            borderRadius: "8px",
            border: "1px #eee solid",
          }}
          width={1280}
          height={720}
          alt="screenshot"
        />
      )}
      {pageSwitch === PageType.HTML && pageContent && (
        <div
          style={{
            width: "70vw",
            height: "750px",
            padding: "8px",
            borderRadius: "8px",
            border: "1px #eee solid",
          }}
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />
      )}
      {/* 操作控制区域 */}
      <Space style={{ marginTop: "16px" }}>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={() =>
            setPageSwitch(
              pageSwitch === PageType.HTML ? PageType.SCREENSHOT : PageType.HTML
            )
          }
        >
          Change View
        </button>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={async () => await handlePerformActions()}
        >
          Perform Actions
        </button>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={() => initTask()}
        >
          Init Page
        </button>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={() => resumeTask()}
        >
          Operate Page
        </button>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={async () => {
            const res = await callLLM([
              {
                role: "system",
                content:
                  'You are a primary school student. All your answers should be in a primary school tone and start with "Okay."',
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "what is in the picture",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: "https://mdn.alipayobjects.com/huamei_i51ojb/afts/img/A*MymQT6e4MiwAAAAAAAAAAAAADmF6AQ/original",
                    },
                  },
                ],
              },
            ]);
            console.log("res =======", res);
          }}
        >
          Test LLM
        </button>
        <button
          style={{ width: "100px", height: "30px" }}
          onClick={handleReset}
        >
          Reset Page
        </button>
      </Space>
    </div>
  );
};
