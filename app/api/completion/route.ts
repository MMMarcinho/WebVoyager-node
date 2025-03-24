// app/api/completion/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// 初始化 OpenAI 实例
const openai = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_LLM_API_URL,
  apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: OpenAI.ChatCompletionCreateParams = await request.json();
    const { messages, stream } = body || {};

    if (!messages?.length) {
      throw new Error("消息为空，无法推理");
    }

    // 同步输出
    if (!stream) {
      const completion: OpenAI.Chat.ChatCompletion =
        await openai.chat.completions.create({
          model: process.env.NEXT_PUBLIC_LLM_MODEL || "gpt-4o",
          messages,
          stream: false,
        });

      return NextResponse.json(
        {
          ok: true,
          completion,
        },
        { status: 200 }
      );
    }
    // 流式输出
    else {
      const response = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_LLM_MODEL || "gpt-4o",
        messages,
        stream: true, // 设置为流式
      });

      // 创建一个可读流
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const part of response) {
            if (part.choices[0]?.delta?.content !== undefined) {
              controller.enqueue(
                `data: ${JSON.stringify({
                  content: part.choices[0].delta.content,
                })}\n\n`
              );
            }
          }
          controller.close();
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        message: "An error occurred while processing the request",
        error,
      },
      { status: 500 }
    );
  }
}
