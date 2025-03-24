import OpenAI from "openai";

/**
 * 同步调用大模型服务
 * @param messages
 */
export const callLLM = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
) => {
  const response = await fetch("/api/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: false, // 确保请求是非流式的
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 获取完整的响应数据
  const data = await response.json();

  return data.completion.choices[0].message.content;
};

/**
 * 流式调用大模型服务
 * @param messages
 */
export const callLLMStream = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
) => {
  const response = await fetch("/api/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: true, // 确保请求是流式的
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 创建一个读取器来逐步读取数据
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 将接收到的字节转换为字符串并解析
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk
      .split("\n\n")
      .filter((line) => line.startsWith("data:"));

    for (const line of lines) {
      // 移除 'data:' 前缀并解析 JSON
      const data = JSON.parse(line.substring(5));
      console.log("Received chunk:", data.content);
    }
  }
};
