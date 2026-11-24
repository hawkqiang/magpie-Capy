import { expect, test } from "bun:test";

import { ChatUseCase } from "../../src/application/chat.ts";
import { DeviceUseCase } from "../../src/application/device.ts";
import { PromptToolBridge } from "../../src/application/tools.ts";
import type { AccountSession } from "../../src/domain/account.ts";
import type { ChatRequest } from "../../src/domain/chat.ts";
import { incrementalPrompt, stableHash, threadKey } from "../../src/domain/thread.ts";
import type { CapyAppPort, CreateJamInput, JamCreated } from "../../src/ports/capy-app.ts";
import type { CapyPublicPort, UpstreamSseFrame } from "../../src/ports/capy-public.ts";
import type { DeviceRuntimePort } from "../../src/ports/device-runtime.ts";
import type { ClockPort, IdPort } from "../../src/ports/platform.ts";
import { MemoryThreadStore, type ThreadStorePort } from "../../src/ports/thread-store.ts";

const session: AccountSession = {
  accountId: "a@b.c",
  uid: "user_1",
  orgId: "org_1",
  clientId: "c".repeat(32),
  accessToken: `capy_${"a".repeat(43)}`,
  clerk: { clientJwt: "client", sessionId: "sess_1" },
  source: "local",
};
const device = { id: "device_1", name: "headless", connected: true };
const clock: ClockPort = { now: () => 1000, async sleep() {} };
function ids(): IdPort {
  let i = 0;
  return { ulid: () => `id${String(i++).padStart(24, "0")}`, uuid: () => "uuid" };
}
function runtime(): DeviceRuntimePort { return { async ensure() { return device; }, close() {} }; }
function sse(event: string, data: unknown, id?: string): UpstreamSseFrame {
  return { event, data: JSON.stringify(data), ...(id ? { id } : {}) };
}
function frames(text: string): UpstreamSseFrame[] {
  return [
    sse("assistant", { callId: "c1", text }),
    sse("transcript", { source: "assistant", text, callId: "c1" }, "cursor_1"),
    sse("done", {}),
  ];
}

interface Tracker {
  app: CapyAppPort;
  publicApi: CapyPublicPort;
  created: CreateJamInput[];
  messages: string[];
  afters: (string | undefined)[];
}

function tracked(sentFrames: UpstreamSseFrame[] = frames("ok"), opts: { failSend?: boolean } = {}): Tracker {
  const created: CreateJamInput[] = [];
  const messages: string[] = [];
  const afters: (string | undefined)[] = [];
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
      created.push(input);
      return { id: input.jamId, primaryMachine: { kind: "device" } };
    },
    async getJam(_jwt, _org, id) { return { id, status: "idle", ask: null }; },
    async getJamEvents() { return []; },
    async interruptJam() {},
  };
  const publicApi: CapyPublicPort = {
    async listModels() { return { items: [] }; },
    async *streamThread(_key, _threadId, _signal, after) {
      afters.push(after);
      for (const frame of sentFrames) yield frame;
    },
    async sendMessage(_key, _threadId, text) {
      if (opts.failSend) throw new Error("send failed");
      messages.push(text);
    },
    async uploadFiles() { return []; },
    async usage() { return {}; },
    async balance() { return {}; },
  };
  return { app, publicApi, created, messages, afters };
}

function useCase(t: Tracker, threadReuse = true, store?: ThreadStorePort): ChatUseCase {
  return new ChatUseCase({
    app: t.app,
    publicApi: t.publicApi,
    device: new DeviceUseCase(runtime()),
    ids: ids(),
    clock,
    tools: new PromptToolBridge(),
    toolsEnabled: false,
    threadReuse,
    threadStore: store,
  });
}

async function collect(uc: ChatUseCase, request: ChatRequest) {
  const out = [];
  for await (const event of uc.stream(session, request)) out.push(event);
  return out;
}

const baseRequest: ChatRequest = {
  model: "capy/deepseek/deepseek-v4.1-flash-ads",
  stream: false,
  messages: [{ role: "user", content: "first task" }],
};

test("thread：stableHash/threadKey 稳定，去掉 system-reminder 噪声", () => {
  expect(stableHash("abc")).toBe(stableHash("abc"));
  expect(stableHash("abc")).not.toBe(stableHash("abd"));
  const a = threadKey("u@o", "m", [{ role: "user", content: "hello" }]);
  const b = threadKey("u@o", "m", [{ role: "user", content: "<system-reminder>noise</system-reminder>hello" }]);
  expect(a).toBe(b);
  expect(threadKey("u@o", "m2", [{ role: "user", content: "hello" }])).not.toBe(a);
});

test("thread：incrementalPrompt 只取最新 tool 结果或 user", () => {
  expect(incrementalPrompt([{ role: "user", content: "u" }])).toBe("用户任务：u");
  expect(incrementalPrompt([
    { role: "user", content: "u" },
    { role: "assistant", content: "", toolCalls: [{ id: "c", name: "t", arguments: "{}" }] },
    { role: "tool", toolCallId: "c", content: "RESULT" },
  ])).toContain("RESULT");
  expect(incrementalPrompt([])).toBe("");
});

test("线程复用：首轮 createJam，次轮 sendMessage 且不复建", async () => {
  const t = tracked();
  const uc = useCase(t);
  await collect(uc, baseRequest);
  expect(t.created.length).toBe(1);
  expect(t.messages.length).toBe(0);
  expect(t.afters[0]).toBeUndefined();

  // 第二轮：同一会话、首条 user 相同，只追加了 assistant/tool。
  const second: ChatRequest = {
    ...baseRequest,
    messages: [
      { role: "user", content: "first task" },
      { role: "assistant", content: "", toolCalls: [{ id: "c1", name: "t", arguments: "{}" }] },
      { role: "tool", toolCallId: "c1", content: "TOOL-OUT" },
    ],
  };
  await collect(uc, second);
  expect(t.created.length).toBe(1); // 没有新建线程
  expect(t.messages.length).toBe(1);
  expect(t.messages[0]).toContain("TOOL-OUT");
  expect(t.afters[1]).toBe("cursor_1"); // 跳过旧流记录
});

test("线程复用关闭：每轮都 createJam，从不 sendMessage", async () => {
  const t = tracked();
  const uc = useCase(t, false);
  await collect(uc, baseRequest);
  await collect(uc, baseRequest);
  expect(t.created.length).toBe(2);
  expect(t.messages.length).toBe(0);
});

test("线程复用：sendMessage 失败时回滚并回退新建线程", async () => {
  const t = tracked(frames("ok"), { failSend: true });
  const uc = useCase(t);
  await collect(uc, baseRequest); // 首轮建线程成功
  const second: ChatRequest = {
    ...baseRequest,
    messages: [
      { role: "user", content: "first task" },
      { role: "tool", toolCallId: "c1", content: "RESULT" },
    ],
  };
  const events = await collect(uc, second); // send 失败 → 回滚 → 新建线程 → 成功
  expect(t.created.length).toBe(2);
  expect(events.some((e) => e.type === "final")).toBe(true);
});

test("线程复用：不同会话 key 各有独立线程", async () => {
  const t = tracked();
  const uc = useCase(t);
  await collect(uc, baseRequest);
  await collect(uc, { ...baseRequest, messages: [{ role: "user", content: "totally different task" }] });
  expect(t.created.length).toBe(2);
});

test("线程复用：插件按请求重建（新实例共享 store）仍能复用", async () => {
  const t = tracked();
  const store = new MemoryThreadStore();
  await collect(useCase(t, true, store), baseRequest);
  const second: ChatRequest = {
    ...baseRequest,
    messages: [
      { role: "user", content: "first task" },
      { role: "assistant", content: "", toolCalls: [{ id: "c1", name: "t", arguments: "{}" }] },
      { role: "tool", toolCallId: "c1", content: "OUT-2" },
    ],
  };
  // 全新 ChatUseCase 实例，只有 store 是共享的：模拟 Magpie 每请求重建插件。
  await collect(useCase(t, true, store), second);
  expect(t.created.length).toBe(1);
  expect(t.messages.length).toBe(1);
  expect(t.messages[0]).toContain("OUT-2");
});
