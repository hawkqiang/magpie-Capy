import type { ChatMessage, ChatRequest, ToolDefinition } from "../domain/chat.ts";

export const REFLECT_ASK = "ask_user_question";
export const REFLECT_DONE = "report_done";

/** 反思请求只声明这两个工具，强制模型在“需要用户信息”与“确认完成”之间二选一。 */
export function reflectionTools(): readonly ToolDefinition[] {
  return [
    {
      type: "function",
      function: {
        name: REFLECT_ASK,
        description: "Ask the user a concise question for the specific information still needed to finish.",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, question: { type: "string" } },
                required: ["id", "question"],
              },
            },
          },
          required: ["questions"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: REFLECT_DONE,
        description: "Report that the task is genuinely complete, with a one-sentence core reason.",
        parameters: {
          type: "object",
          properties: { reason: { type: "string" } },
          required: ["reason"],
        },
      },
    },
  ];
}

/** 从真实请求里取最近一条人类诉求，忽略 DSH 注入的 reminder / 时间上下文。 */
function humanIntent(messages: readonly ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    const raw = typeof m.content === "string"
      ? m.content
      : m.content.map(p => ("text" in p ? p.text : "")).join("\n");
    const t = raw.trim();
    if (!t || t.startsWith("<system-reminder>") || t.startsWith("Time sampled")) continue;
    return t.slice(0, 4000);
  }
  return "";
}

/** 反思请求的用户消息：把原始诉求和模型刚才的回复原样交给模型自己判断。 */
export function reflectionPrompt(request: ChatRequest, replyText: string): string {
  return [
    "You are a completion reviewer for a single coding-agent turn.",
    "",
    "The user's request was:",
    "<request>",
    humanIntent(request.messages) || "(not available)",
    "</request>",
    "",
    "The assistant's final reply was:",
    "<reply>",
    replyText.slice(0, 6000),
    "</reply>",
    "",
    "Decide whether the assistant has truly completed the user's request.",
    "- If it still needs information from the user to proceed, call ask_user_question with a concise question asking for exactly that missing information.",
    "- If the request is genuinely complete, call report_done with a one-sentence core reason.",
    "Call exactly one of these tools. Do not output plain text.",
  ].join("\n");
}
