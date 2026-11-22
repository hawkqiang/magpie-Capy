import { expect, test } from "bun:test";

import { ChatUseCase } from "../../src/application/chat.ts";
import { DeviceUseCase } from "../../src/application/device.ts";
import { PromptToolBridge } from "../../src/application/tools.ts";
import type { AccountSession } from "../../src/domain/account.ts";
import type { ChatRequest } from "../../src/domain/chat.ts";
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

function fakePublic(frames: UpstreamSseFrame[]): CapyPublicPort {
  return {
    async listModels() { return { items: [] }; },
    async *streamThread() {
      for (const frame of frames) yield frame;
    },
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
    { type: "final", text: "pong" },
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
