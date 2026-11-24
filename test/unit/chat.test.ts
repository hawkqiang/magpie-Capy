import { expect, test } from "bun:test";

import { ChatUseCase } from "../../src/application/chat.ts";
import { captureInvocation } from "../../src/application/capture.ts";
import { DeviceUseCase } from "../../src/application/device.ts";
import { PromptToolBridge } from "../../src/application/tools.ts";
import type { AccountSession } from "../../src/domain/account.ts";
import { buildPrompt } from "../../src/domain/chat.ts";
import type { ChatMessage, ChatRequest } from "../../src/domain/chat.ts";
import type { CapyAppPort, CreateJamInput, DeviceInfo, JamCreated } from "../../src/ports/capy-app.ts";
import type { CapyPublicPort, UpstreamSseFrame } from "../../src/ports/capy-public.ts";
import type { DeviceRuntimePort } from "../../src/ports/device-runtime.ts";
import type { ClockPort, IdPort } from "../../src/ports/platform.ts";

const session: AccountSession = {
  accountId: "a@b.c",
  uid: "user_1",
  orgId: "org_1",
  clientId: "c".repeat(32),
  accessToken: `capy_${"a".repeat(43)}`,
  clerk: { clientJwt: "client", sessionId: "sess_1" },
  source: "local",
};

const device: DeviceInfo = { id: "device_1", name: "magpie-headless", connected: true };

function ids(): IdPort {
  let i = 0;
  return {
    ulid: () => `${String(i++).padStart(2, "0")}${"0".repeat(24)}`,
    uuid: () => "uuid",
  };
}

const clock: ClockPort = {
  now: () => 1000,
  async sleep() {},
};

function fakeApp() {
  const calls: CreateJamInput[] = [];
  let interrupted = 0;
  const app: CapyAppPort = {
    async sessionJwt() { return "jwt"; },
    async me() { return { id: "user_1" }; },
    async organizations() { return [{ id: "org_1" }]; },
    async mintApiKey() { return { plaintext: "capy_key" }; },
    async listDevices() { return [device]; },
    async renameDevice() {},
    async startDeviceCode() { throw new Error("unused"); },
    async approveDeviceCode() {},
    async pollDeviceCode() { throw new Error("unused"); },
    async createJam(_jwt, _org, input): Promise<JamCreated> {
      calls.push(input);
      return {
        id: input.jamId,
        primaryMachine: { kind: "device" },
      };
    },
    async getJam(_jwt, _org, id) {
      return { id, status: "idle", ask: null };
    },
    async getJamEvents() { return []; },
    async interruptJam() { interrupted += 1; },
  };
  return { app, calls, interrupted: () => interrupted };
}

function fakePublic(frames: UpstreamSseFrame[], onMessage?: (text: string) => void): CapyPublicPort {
  return {
    async listModels() { return { items: [] }; },
    async *streamThread() {
      for (const frame of frames) yield frame;
    },
    async sendMessage(_apiKey, _threadId, text) { onMessage?.(text); },
    async uploadFiles() { return []; },
    async usage() { return {}; },
    async balance() { return {}; },
  };
}

function fakeRuntime(): DeviceRuntimePort {
  return {
    async ensure() { return device; },
    close() {},
  };
}

function sse(event: string, data: unknown): UpstreamSseFrame {
  return { event, data: JSON.stringify(data) };
}

const request: ChatRequest = {
  model: "particle/particle-1",
  stream: false,
  messages: [{ role: "user", content: "ping" }],
};

test("ChatUseCase：ensure → createJam → SSE → 事件", async () => {
  const { app, calls } = fakeApp();
  const useCase = new ChatUseCase({
    app,
    publicApi: fakePublic([
      sse("assistant", { callId: "c1", text: "po" }),
      sse("assistant", { callId: "c1", text: "pong" }),
      sse("transcript", { source: "assistant", text: "pong", callId: "c1" }),
      sse("turn", { phase: "end", outcome: "settled" }),
      sse("run", { phase: "end" }),
      sse("done", {}),
    ]),
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
  });

  const events = [];
  for await (const event of useCase.stream(session, request)) events.push(event);

  expect(events).toEqual([
    { type: "delta", text: "po" },
    { type: "delta", text: "ng" },
    { type: "final", text: "pong", committed: true },
    { type: "done" },
  ]);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.message).toBe("ping");
  expect(calls[0]?.deviceId).toBe(device.id);
  expect(calls[0]?.modelId).toBe("particle/particle-1");
  expect(calls[0]?.clientKey).toBe(calls[0]?.requestId);
});

test("ChatUseCase：ADS 模型建线程带 ads 能力位", async () => {
  const { app, calls } = fakeApp();
  const useCase = new ChatUseCase({
    app,
    publicApi: fakePublic([]),
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
  });
  for await (const _event of useCase.stream(session, {
    ...request,
    model: "zai/glm-5.3-flash-ads",
  })) { /* drain */ }
  expect(calls[0]?.ads).toBe(true);
});

test("ChatUseCase：线程 failed 且无文本时返回 jam error，而不是空完成", async () => {
  const base = fakeApp();
  const app: CapyAppPort = {
    ...base.app,
    async getJam(_jwt, _org, id) {
      return { id, status: "failed", ask: null };
    },
    async getJamEvents() {
      return [{
        id: "event_1",
        kind: "error",
        payload: { code: "region_unsupported", message: "only US/CA/UK" },
      }];
    },
  };
  const useCase = new ChatUseCase({
    app,
    publicApi: fakePublic([]),
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
  });
  const events = [];
  for await (const event of useCase.stream(session, request)) events.push(event);
  expect(events).toHaveLength(1);
  expect(events[0]?.type).toBe("error");
  if (events[0]?.type === "error") {
    expect(events[0].error.kind).toBe("region_unsupported");
    expect(events[0].error.status).toBe(403);
  }
});

test("ChatUseCase：cancel 调 interrupt", async () => {
  const { app, interrupted } = fakeApp();
  const useCase = new ChatUseCase({
    app,
    publicApi: fakePublic([]),
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
  });
  await useCase.cancel(session, "jam_1");
  expect(interrupted()).toBe(1);
});

test("ChatUseCase：getJam 失败返回明确错误，不返回空完成", async () => {
  const base = fakeApp();
  const app: CapyAppPort = {
    ...base.app,
    async getJam() { throw new Error("status lookup failed"); },
  };
  const useCase = new ChatUseCase({
    app,
    publicApi: fakePublic([]),
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
  });
  const events = [];
  for await (const event of useCase.stream(session, request)) events.push(event);
  expect(events[0]?.type).toBe("error");
  if (events[0]?.type === "error") {
    expect(events[0].error.kind).toBe("upstream_unavailable");
  }
});

test("buildPrompt：普通单轮文本保持现有行为", () => {
  expect(buildPrompt([{ role: "user", content: "  ping  " }])).toBe("ping");
  expect(buildPrompt([
    { role: "system", content: "be terse" },
    { role: "user", content: " hi " },
  ])).toBe("<system>\nbe terse\n</system>\n\n<user>\nhi\n</user>");
});

test("buildPrompt：多轮工具调用保留调用 ID、工具名、原始参数与结果原文", () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "run one" },
    {
      role: "assistant",
      content: "",
      toolCalls: [{ id: "call_1", name: "one", arguments: '{"x": 2}' }],
    },
    { role: "tool", name: "one", toolCallId: "call_1", content: "  hi\n there  " },
  ];
  const prompt = buildPrompt(messages);
  expect(prompt.match(/call_1/g)?.length).toBe(2);
  expect(prompt).toContain('id="call_1" name="one"');
  expect(prompt).toContain('{"x": 2}');
  expect(prompt).toContain("  hi\n there  ");
  expect(prompt).not.toContain("[调用工具");
  expect(prompt).not.toContain("(无输出)");
});

test("buildPrompt：tool 结果按调用 ID 绑定原调用名，name 缺失也不丢结果", () => {
  const prompt = buildPrompt([
    { role: "user", content: "two" },
    {
      role: "assistant",
      content: "",
      toolCalls: [
        { id: "call_a", name: "alpha", arguments: '{"a":1}' },
        { id: "call_b", name: "beta", arguments: '{"b":2}' },
      ],
    },
    { role: "tool", toolCallId: "call_b", content: "B-Result" },
    { role: "tool", toolCallId: "call_a", content: "A-Result" },
  ]);
  expect(prompt.match(/call_a/g)?.length).toBe(2);
  expect(prompt.match(/call_b/g)?.length).toBe(2);
  expect(prompt).toContain('<tool_result id="call_a" name="alpha">\nA-Result\n</tool_result>');
  expect(prompt).toContain('<tool_result id="call_b" name="beta">\nB-Result\n</tool_result>');
  expect(prompt).toContain('{"a":1}');
  expect(prompt).toContain('{"b":2}');
});

test("buildPrompt：空白工具结果原样保留，不改写成结论", () => {
  const prompt = buildPrompt([
    { role: "user", content: "q" },
    {
      role: "assistant",
      content: "",
      toolCalls: [{ id: "call_x", name: "t", arguments: "{}" }],
    },
    { role: "tool", toolCallId: "call_x", content: "   " },
  ]);
  expect(prompt).toContain('<tool_result id="call_x" name="t">\n   \n</tool_result>');
  expect(prompt).not.toContain("(无输出)");
});

test("ChatUseCase：toolsEnabled 且收到同 jamId 的合法 RPC 时立即短路并 interruptJam", async () => {
  const { app, interrupted } = fakeApp();
  let streamAborted = false;
  const publicApi: CapyPublicPort = {
    async listModels() { return { items: [] }; },
    async *streamThread(_apiKey, threadId, signal) {
      // 先来一条纯 preamble 初始化（必须忽略，不触发短路）
      captureInvocation("bash", { command: "__capy_co_author=\"\"\nunset __capy_co_author" }, threadId);
      yield sse("assistant", { callId: "c1", text: "checking..." });
      // 再来一条真实 read RPC（必须立即短路并中止 SSE）
      captureInvocation("read", { path: "foo.ts", offset: 2, limit: 5 }, threadId);
      if (signal?.aborted) {
        streamAborted = true;
        throw new DOMException("Aborted", "AbortError");
      }
      yield sse("done", {});
    },
    async sendMessage() {},
    async uploadFiles() { return []; },
    async usage() { return {}; },
    async balance() { return {}; },
  };
  const useCase = new ChatUseCase({
    app,
    publicApi,
    device: new DeviceUseCase(fakeRuntime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: true,
  });

  const events = [];
  for await (const event of useCase.stream(session, {
    ...request,
    tools: [{
      type: "function",
      function: {
        name: "read",
        parameters: {
          type: "object",
          properties: { file_path: { type: "string" }, offset: { type: "number" }, limit: { type: "number" } },
          required: ["file_path"],
        },
      },
    }],
    toolChoice: "auto",
  })) {
    events.push(event);
  }

  expect(streamAborted).toBe(true);
  expect(interrupted()).toBe(1);
  expect(events.at(-2)).toEqual({
    type: "final",
    text: "",
    committed: true,
    internalTools: true,
    capturedCalls: [{
      name: "read",
      arguments: JSON.stringify({ file_path: "foo.ts", offset: 2, limit: 5 }),
    }],
  });
  expect(events.at(-1)).toEqual({ type: "done" });
});
