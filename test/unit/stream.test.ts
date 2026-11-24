import { expect, test } from "bun:test";

import { PublicSseNormalizer } from "../../src/application/stream.ts";
import type { SseFrame } from "../../src/protocol/sse.ts";

function frame(event: string, data: unknown): SseFrame {
  return { event, data: JSON.stringify(data) };
}

test("assistant 增量：累积 + finish", () => {
  const normalizer = new PublicSseNormalizer();
  const events = [
    ...normalizer.push(frame("assistant", { callId: "c1", text: "po" })),
    ...normalizer.push(frame("assistant", { callId: "c1", text: "pong" })),
    ...normalizer.finish(),
  ];
  expect(events).toEqual([
    { type: "delta", text: "po" },
    { type: "delta", text: "ng" },
    { type: "final", text: "pong", committed: false },
    { type: "done" },
  ]);
});

test("assistant 全文重复：只转发一次", () => {
  const normalizer = new PublicSseNormalizer();
  const first = normalizer.push(frame("assistant", { callId: "c1", text: "pong" }));
  const second = normalizer.push(frame("assistant", { callId: "c1", text: "pong" }));
  expect(first).toEqual([{ type: "delta", text: "pong" }]);
  expect(second).toEqual([]);
});

test("transcript 校正：只有 transcript 时补发 delta", () => {
  const normalizer = new PublicSseNormalizer();
  const events = [
    ...normalizer.push(frame("assistant", { callId: "c1", text: "po" })),
    ...normalizer.push(frame("transcript", { source: "assistant", text: "pong", callId: "c1" })),
    ...normalizer.finish(),
  ];
  expect(events).toEqual([
    { type: "delta", text: "po" },
    { type: "delta", text: "ng" },
    { type: "final", text: "pong", committed: true },
    { type: "done" },
  ]);
});

test("只有预览、没有 transcript：final 标记未提交", () => {
  const normalizer = new PublicSseNormalizer();
  normalizer.push(frame("assistant", { callId: "c1", text: "partial" }));
  normalizer.push(frame("turn", { phase: "end", outcome: "dropped" }));
  expect(normalizer.finish()).toEqual([
    { type: "final", text: "partial", committed: false },
    { type: "done" },
  ]);
});

test("region_unsupported：error 事件，finish 不再 final", () => {
  const normalizer = new PublicSseNormalizer();
  const events = normalizer.push(frame("error", { code: "region_unsupported", message: "only US" }));
  expect(events).toHaveLength(1);
  expect(events[0]?.type).toBe("error");
  if (events[0]?.type === "error") {
    expect(events[0].error.kind).toBe("region_unsupported");
    expect(events[0].error.status).toBe(403);
  }
  expect(normalizer.finish()).toEqual([]);
});

test("user transcript / status / heartbeat 不进入事件流", () => {
  const normalizer = new PublicSseNormalizer();
  expect(normalizer.push(frame("transcript", { source: "user", text: "hi" }))).toEqual([]);
  expect(normalizer.push(frame("status", { status: "working" }))).toEqual([]);
  expect(normalizer.push({ event: "heartbeat", data: "{}" })).toEqual([]);
});

test("上游 tool_call 摘要被忽略，不变成调用事件", () => {
  const normalizer = new PublicSseNormalizer();
  const events = [
    ...normalizer.push(frame("tool_call", { callId: "toolu_1", name: "bash", text: "Running tests" })),
    ...normalizer.finish(),
  ];
  expect(events).toEqual([{ type: "done" }]);
});

test("内部工具信号：live tool_call / transcript(tool) 都记账，但不产生调用", () => {
  const live = new PublicSseNormalizer();
  live.push(frame("tool_call", { callId: "t1", name: "bash", text: "x" }));
  live.push(frame("transcript", { source: "assistant", text: "done", callId: "a1" }));
  expect(live.usedInternalTools).toBe(true);
  expect(live.finish()).toEqual([
    { type: "final", text: "done", committed: true, internalTools: true },
    { type: "done" },
  ]);

  const committed = new PublicSseNormalizer();
  committed.push(frame("transcript", { source: "tool", id: "t2", tool: "read", text: "summary" }));
  committed.push(frame("transcript", { source: "assistant", text: "ok", callId: "a2" }));
  expect(committed.usedInternalTools).toBe(true);

  const plain = new PublicSseNormalizer();
  plain.push(frame("transcript", { source: "assistant", text: "hi", callId: "a3" }));
  expect(plain.usedInternalTools).toBe(false);
  expect(plain.finish()).toEqual([
    { type: "final", text: "hi", committed: true },
    { type: "done" },
  ]);
});
