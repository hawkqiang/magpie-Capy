import type { RawModel } from "../../domain/model.ts";
import type { Balance, UsageTotals } from "../../domain/usage.ts";
import { CapyError, errorText, mapUpstream } from "../../domain/errors.ts";
import type {
  CapyPublicPort,
  UpstreamSseFrame,
  UploadCandidate,
  UploadedFile,
} from "../../ports/capy-public.ts";
import { decodeSseStream } from "../../protocol/sse.ts";
import { requestCapyJson } from "../platform/http.ts";
import { CAPY_PUBLIC, publicHeaders } from "./endpoints.ts";

function rawModels(items: unknown): RawModel[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item): RawModel[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : "";
    if (!id) return [];
    const modes = Array.isArray(record.reasoningModes)
      ? record.reasoningModes.filter((mode): mode is string => typeof mode === "string")
      : undefined;
    return [{
      id,
      ...(typeof record.name === "string" ? { name: record.name } : {}),
      ...(modes ? { reasoningModes: modes } : {}),
    }];
  });
}


export class CapyPublicClient implements CapyPublicPort {
  private readonly fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch) {
    this.fetchImpl = fetchImpl;
  }

  async listModels(apiKey: string, signal?: AbortSignal): Promise<{
    readonly items: readonly RawModel[];
  }> {
    const body = await requestCapyJson(
      this.fetchImpl,
      `${CAPY_PUBLIC}/models`,
      { method: "GET", headers: publicHeaders(apiKey), ...(signal ? { signal } : {}) },
      20_000,
    );
    const record = body as Record<string, unknown>;
    return { items: rawModels(record.items) };
  }

  async sendMessage(
    apiKey: string,
    threadId: string,
    text: string,
    clientKey: string,
    signal?: AbortSignal,
  ): Promise<void> {
    await requestCapyJson(
      this.fetchImpl,
      `${CAPY_PUBLIC}/threads/${encodeURIComponent(threadId)}/message`,
      {
        method: "POST",
        headers: publicHeaders(apiKey, { "content-type": "application/json" }),
        body: JSON.stringify({ text, clientKey, delivery: "queue" }),
        ...(signal ? { signal } : {}),
      },
      30_000,
    );
  }

  async *streamThread(
    apiKey: string,
    threadId: string,
    signal?: AbortSignal,
    after?: string,
  ): AsyncIterable<UpstreamSseFrame> {
    const afterParam = after ? `&after=${encodeURIComponent(after)}` : "";
    const url = `${CAPY_PUBLIC}/threads/${encodeURIComponent(threadId)}/stream?until=run${afterParam}`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          ...publicHeaders(apiKey),
          accept: "text/event-stream",
        },
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new CapyError("upstream_unavailable", `连接 Capy 流失败：${errorText(error)}`, { cause: error });
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let body: unknown = null;
      try { body = JSON.parse(text); } catch {}
      throw mapUpstream(response.status, body, text.slice(0, 300));
    }
    if (!response.body) throw new CapyError("upstream_unavailable", "Capy 流没有响应体");
    const body = response.body;
    async function* chunks(): AsyncIterable<Uint8Array> {
      const reader = body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          if (value) yield value;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
    for await (const frame of decodeSseStream(chunks())) {
      yield {
        event: frame.event,
        data: frame.data,
        ...(frame.id ? { id: frame.id } : {}),
      };
    }
  }

  async uploadFiles(
    apiKey: string,
    files: readonly UploadCandidate[],
    signal?: AbortSignal,
  ): Promise<readonly UploadedFile[]> {
    if (files.length === 0) return [];
    const body = await requestCapyJson(
      this.fetchImpl,
      `${CAPY_PUBLIC}/files`,
      {
        method: "POST",
        headers: publicHeaders(apiKey, { "content-type": "application/json" }),
        body: JSON.stringify({
          files: files.map((file) => ({
            name: file.name,
            mediaType: file.mediaType,
            sizeBytes: file.bytes.length,
          })),
        }),
        ...(signal ? { signal } : {}),
      },
      30_000,
    );
    const targets = (body as { targets?: unknown })?.targets;
    if (!Array.isArray(targets) || targets.length !== files.length) {
      throw new CapyError("upstream_error", "Capy 没有返回足够的文件上传目标");
    }
    const out: UploadedFile[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const target = targets[i] as { fileId?: unknown; url?: unknown } | undefined;
      if (!file || !target || typeof target.fileId !== "string" || typeof target.url !== "string") {
        throw new CapyError("upstream_error", "Capy 文件上传目标缺少 fileId/url");
      }
      const timeout = AbortSignal.timeout(60_000);
      const putSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const put = await this.fetchImpl(target.url, {
        method: "PUT",
        headers: { "content-type": file.mediaType },
        body: file.bytes as unknown as BodyInit,
        signal: putSignal,
      });
      if (!put.ok) {
        const detail = await put.text().catch(() => "");
        throw new CapyError("upstream_error", `附件上传失败（HTTP ${put.status}）`, {
          detail: detail.slice(0, 200),
        });
      }
      out.push({
        fileId: target.fileId,
        name: file.name,
        mediaType: file.mediaType,
        sizeBytes: file.bytes.length,
      });
    }
    return out;
  }

  async usage(apiKey: string, signal?: AbortSignal): Promise<UsageTotals> {
    const body = await requestCapyJson(
      this.fetchImpl,
      `${CAPY_PUBLIC}/usage`,
      { method: "GET", headers: publicHeaders(apiKey), ...(signal ? { signal } : {}) },
      20_000,
    );
    return (body ?? {}) as UsageTotals;
  }

  async balance(apiKey: string, signal?: AbortSignal): Promise<Balance> {
    const body = await requestCapyJson(
      this.fetchImpl,
      `${CAPY_PUBLIC}/usage/balance`,
      { method: "GET", headers: publicHeaders(apiKey), ...(signal ? { signal } : {}) },
      20_000,
    );
    return (body ?? {}) as Balance;
  }
}
