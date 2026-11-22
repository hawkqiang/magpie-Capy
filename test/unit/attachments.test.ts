import { expect, test } from "bun:test";

import { collectAttachments } from "../../src/application/attachments.ts";
import type { ChatMessage } from "../../src/domain/chat.ts";

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const dataUrl = `data:image/png;base64,${png}`;

test("attachments：data URL 图片 → 上传候选 + 文本标记", async () => {
  const messages: ChatMessage[] = [{
    role: "user",
    content: [
      { type: "text", text: "look" },
      { type: "image_url", url: dataUrl, name: "red.png" },
    ],
  }];
  const result = await collectAttachments(messages, { fetchImpl: fetch });
  expect(result.attachments).toHaveLength(1);
  expect(result.attachments[0]?.name).toBe("red.png");
  expect(result.attachments[0]?.mediaType).toBe("image/png");
  expect(result.messages[0]?.content).toEqual([
    { type: "text", text: "look" },
    { type: "text", text: "[图片: red.png]" },
  ]);
});

test("attachments：没有 8 个/60 MB 的自造上限", async () => {
  const parts = Array.from({ length: 12 }, (_, i) => ({
    type: "image_url" as const,
    url: dataUrl,
    name: `img-${i}.png`,
  }));
  const result = await collectAttachments([{ role: "user", content: parts }], { fetchImpl: fetch });
  expect(result.attachments).toHaveLength(12);
});

test("attachments：本机/内网 URL 拒绝（SSRF）", async () => {
  await expect(collectAttachments([{
    role: "user",
    content: [{ type: "image_url", url: "http://127.0.0.1/secret.png" }],
  }], { fetchImpl: fetch })).rejects.toMatchObject({ kind: "invalid_request" });
});

test("attachments：远程 302 到内网地址被拒绝（逐跳校验）", async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    return new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1/secret.png" },
    });
  }) as unknown as typeof fetch;
  await expect(collectAttachments([{
    role: "user",
    content: [{ type: "image_url", url: "https://example.com/a.png" }],
  }], { fetchImpl: fakeFetch })).rejects.toMatchObject({ kind: "invalid_request" });
  expect(calls).toBe(1);
});
