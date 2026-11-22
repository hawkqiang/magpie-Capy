import { expect, test } from "bun:test";

import { decodeSseStream, SseParser } from "../../src/protocol/sse.ts";

test("SSE：帧跨 chunk 边界", () => {
  const parser = new SseParser();
  expect(parser.feed("event: assistant\ndata: {\"a\"")).toEqual([]);
  const frames = parser.feed(":1}\n\n");
  expect(frames).toHaveLength(1);
  expect(frames[0]?.event).toBe("assistant");
  expect(frames[0]?.data).toBe("{\"a\":1}");
});

test("SSE：CRLF 与多行 data", () => {
  const parser = new SseParser();
  const frames = parser.feed("event: transcript\r\ndata: one\r\ndata: two\r\n\r\n");
  expect(frames).toHaveLength(1);
  expect(frames[0]?.data).toBe("one\ntwo");
});

test("SSE：注释/retry/空帧", () => {
  const parser = new SseParser();
  const frames = parser.feed(": comment\nretry: 2000\n\nevent: done\ndata: {}\n\n");
  expect(frames).toHaveLength(1);
  expect(frames[0]?.event).toBe("done");
  expect(frames[0]?.data).toBe("{}");
});

test("SSE：字节流解码", async () => {
  async function* source() {
    yield new TextEncoder().encode("event: assistant\ndata: po");
    yield new TextEncoder().encode("ng\n\n");
  }
  const events = [];
  for await (const frame of decodeSseStream(source())) events.push(frame);
  expect(events).toHaveLength(1);
  expect(events[0]?.data).toBe("pong");
});
