import { expect, test } from "bun:test";

import type { ChatEvent } from "../../src/domain/chat.ts";
import { buildPrompt } from "../../src/domain/chat.ts";
import { CapyError } from "../../src/domain/errors.ts";
import {
  encodeChatStream,
  encodeErrorResponse,
  encodeToolCallCompletion,
  encodeToolCallStream,
  parseChatRequest,
} from "../../src/protocol/openai.ts";

test("parseChatRequest：文本 / 图片 / reasoning_effort", () => {
  const request = parseChatRequest({
    model: "particle/particle-1",
    stream: true,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: "be terse" },
      {
        role: "user",
        content: [
          { type: "text", text: "look" },
          { type: "image_url", image_url: { url: "data:image/png;base64,AA==" } },
        ],
      },
    ],
  });
  expect(request.model).toBe("particle/particle-1");
  expect(request.stream).toBe(true);
  expect(request.reasoningEffort).toBe("low");
  expect(request.messages[1]?.content).toEqual([
    { type: "text", text: "look" },
    { type: "image_url", url: "data:image/png;base64,AA==" },
  ]);
});

test("parseChatRequest：assistant tool_calls 保留", () => {
  const request = parseChatRequest({
    model: "m",
    messages: [{
      role: "assistant",
      content: null,
      tool_calls: [{
        id: "call_1",
        type: "function",
        function: { name: "get_weather", arguments: "{\"city\":\"Paris\"}" },
      }],
    }],
  });
  expect(request.messages[0]?.toolCalls).toEqual([
    { id: "call_1", name: "get_weather", arguments: "{\"city\":\"Paris\"}" },
  ]);
});

test("parseChatRequest：空 messages / 未知 role → invalid_request", () => {
  expect(() => parseChatRequest({ model: "m", messages: [] })).toThrow(CapyError);
  expect(() => parseChatRequest({
    model: "m",
    messages: [{ role: "robot", content: "x" }],
  })).toThrow(CapyError);
});

test("buildPrompt：单条 user 原样；多轮/系统块", () => {
  expect(buildPrompt([{ role: "user", content: "  ping  " }])).toBe("ping");
  const multi = buildPrompt([
    { role: "system", content: "be terse" },
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
    { role: "user", content: "again" },
  ]);
  expect(multi).toContain("<system>\nbe terse\n</system>");
  expect(multi).toContain("<conversation>");
  expect(multi).toContain("<user>\nagain\n</user>");
  expect(multi).toContain("Reply to the last user message.");
});

test("buildPrompt：超长单条 user 原样保留，不按 160k 字符裁剪", () => {
  const content = `HEAD-${"a".repeat(120_000)}${"b".repeat(120_000)}-TAIL`;
  const text = buildPrompt([{ role: "user", content }]);
  expect(text).toBe(content);
  expect(text.length).toBeGreaterThan(160_000);
});

test("buildPrompt：超长多轮不丢任何消息", () => {
  const messages = Array.from({ length: 40 }, (_, i) => ({
    role: "user" as const,
    content: `MSG_${i}_${"x".repeat(5000)}`,
  }));
  const text = buildPrompt(messages);
  expect(text.length).toBeGreaterThan(160_000);
  expect(text).toContain("MSG_0_");
  expect(text).toContain("MSG_39_");
  expect(text).not.toMatch(/已省略|已截断/);
});

test("buildPrompt：超长 system 原样保留，不被压缩", () => {
  const system = `SYS_${"s".repeat(200_000)}`;
  const question = `QUESTION-${"q".repeat(20_000)}-END`;
  const text = buildPrompt([
    { role: "system", content: system },
    { role: "user", content: question },
  ]);
  expect(text.length).toBeGreaterThan(200_000);
  expect(text).toContain(system);
  expect(text).toContain(question);
  expect(text).not.toMatch(/已省略|已截断/);
});

test("encodeChatStream：chunk / stop / [DONE]", async () => {
  async function* events(): AsyncIterable<ChatEvent> {
    yield { type: "delta", text: "po" };
    yield { type: "delta", text: "ng" };
    yield { type: "final", text: "pong" };
    yield { type: "done" };
  }
  const response = encodeChatStream(events(), {
    id: "chatcmpl-1",
    model: "particle/particle-1",
    created: 1,
  });
  const text = await response.text();
  expect(text).toContain("\"content\":\"po\"");
  expect(text).toContain("\"content\":\"ng\"");
  expect(text).toContain("\"finish_reason\":\"stop\"");
  expect(text).toContain("data: [DONE]");
});

test("encodeErrorResponse：401 带 sign-in header", async () => {
  const response = encodeErrorResponse(new CapyError("sign_in_required", "expired"));
  expect(response.status).toBe(401);
  expect(response.headers.get("x-magpie-sign-in")).toBe("expired");
  const body = await response.json() as { error: { code: string } };
  expect(body.error.code).toBe("sign_in_required");
});

test("parseChatRequest：tools/tool_choice 为 null 按未提供处理", () => {
  const request = parseChatRequest({ model: "m", messages: [{ role: "user", content: "x" }], tools: null, tool_choice: null });
  expect(request.tools).toBeUndefined();
  expect(request.toolChoice).toBeUndefined();
});

test("parseChatRequest：工具名重复 / 强制未声明工具 / required 无工具 → 拒绝", () => {
  const tool = { type: "function", function: { name: "a" } };
  expect(() => parseChatRequest({
    model: "m",
    messages: [{ role: "user", content: "x" }],
    tools: [tool, tool],
  })).toThrow(CapyError);
  expect(() => parseChatRequest({
    model: "m",
    messages: [{ role: "user", content: "x" }],
    tools: [tool],
    tool_choice: { type: "function", function: { name: "b" } },
  })).toThrow(CapyError);
  expect(() => parseChatRequest({
    model: "m",
    messages: [{ role: "user", content: "x" }],
    tools: [],
    tool_choice: "required",
  })).toThrow(CapyError);
});

test("encodeToolCallCompletion：tool_calls / tool_call_id / finish_reason", async () => {
  const response = encodeToolCallCompletion({ id: "c1", model: "m", created: 1 }, [
    { id: "call_1", name: "bash", arguments: "{\"command\":\"pwd\"}" },
  ]);
  const body = await response.json() as {
    choices: { message: { content: null; tool_calls: { id: string; type: string; function: { name: string; arguments: string } }[] }; finish_reason: string }[];
  };
  expect(body.choices[0]?.message.content).toBeNull();
  expect(body.choices[0]?.message.tool_calls[0]).toEqual({
    id: "call_1",
    type: "function",
    function: { name: "bash", arguments: "{\"command\":\"pwd\"}" },
  });
  expect(body.choices[0]?.finish_reason).toBe("tool_calls");
  expect((body as { usage?: unknown }).usage).toEqual({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
});

test("encodeToolCallStream：delta.tool_calls / finish_reason / [DONE]", async () => {
  const response = encodeToolCallStream({ id: "c1", model: "m", created: 1 }, [
    { id: "call_1", name: "bash", arguments: "{\"command\":\"pwd\"}" },
  ]);
  const text = await response.text();
  expect(text).toContain("\"delta\":{\"role\":\"assistant\",\"content\":null}");
  expect(text).toContain("\"tool_calls\":[{\"index\":0,\"id\":\"call_1\",\"type\":\"function\"");
  expect(text).toContain("\"finish_reason\":\"tool_calls\"");
  expect(text.endsWith("data: [DONE]\n\n")).toBe(true);
});
