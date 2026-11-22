import { isFilePart, isImagePart, isTextPart, type ChatMessage, type ContentPart, type FilePart, type ImagePart } from "../domain/chat.ts";
import { CapyError } from "../domain/errors.ts";
import type { UploadCandidate } from "../ports/capy-public.ts";

/** 公开 OpenAPI：单文件 250 MB；没有数量/总大小上限。 */
const MAX_ATTACHMENT_BYTES = 262_144_000;
const MAX_REDIRECTS = 3;
const REMOTE_TIMEOUT_MS = 30_000;

const DATA_URL = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/u;
const BARE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/u;
const PRIVATE_HOST = /^(?:localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|::1$|\[::1\]$|\[::\]$|fe80:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|.*\.local$)/iu;

interface ResolvedAttachment {
  readonly candidate: UploadCandidate;
  readonly marker: string;
}

function mediaTypeOf(value: unknown, fallback = "application/octet-stream"): string {
  const text = String(value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/u.test(text) ? text : fallback;
}

function safeName(name: unknown, mediaType: string, index: number): string {
  const base = String(name ?? "").split(/[\\/]/u).pop()?.replace(/[\u0000-\u001f<>:"|?*]/gu, "").trim();
  if (base) return base.slice(0, 200);
  const ext = mediaType.split("/")[1]?.replace(/[^a-z0-9]/giu, "") || "bin";
  return `attachment-${index + 1}.${ext}`;
}

function assertSize(bytes: Uint8Array, name: string): void {
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new CapyError("invalid_request", `附件 ${name} 超过 250 MB（单文件上限）`);
  }
}

function decodeDataUrl(value: string, fallbackType: string): { mediaType: string; bytes: Uint8Array } {
  const match = DATA_URL.exec(value);
  if (!match) throw new CapyError("invalid_request", "附件 data URL 无法解析");
  const mediaType = mediaTypeOf(match[1], fallbackType);
  try {
    const payload = match[3] ?? "";
    if (match[2]) {
      if (!BARE_BASE64.test(payload) || payload.length % 4 !== 0) {
        throw new Error("invalid base64");
      }
      return { mediaType, bytes: Buffer.from(payload, "base64") };
    }
    return { mediaType, bytes: Buffer.from(decodeURIComponent(payload), "utf8") };
  } catch (error) {
    throw new CapyError("invalid_request", "附件 data URL 内容无法解码", { cause: error });
  }
}

function assertPublicUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch {
    throw new CapyError("invalid_request", "附件 URL 不是合法地址");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CapyError("invalid_request", "附件只支持 http/https URL 或 data URL");
  }
  if (PRIVATE_HOST.test(url.hostname)) {
    throw new CapyError("invalid_request", "附件 URL 指向本机/内网地址，已拒绝（SSRF）");
  }
  return url;
}

function timeoutSignal(parent?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
  timer.unref?.();
  const onAbort = () => controller.abort();
  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onAbort);
    },
  };
}

async function fetchWithSafeRedirects(
  fetchImpl: typeof fetch,
  raw: string,
  signal: AbortSignal | undefined,
): Promise<Response> {
  let url = assertPublicUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "image/*,application/pdf,*/*;q=0.8" },
      redirect: "manual",
      ...(signal ? { signal } : {}),
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    if (hop === MAX_REDIRECTS) {
      throw new CapyError("invalid_request", "远程附件重定向次数过多");
    }
    url = assertPublicUrl(new URL(location, url).toString());
  }
  throw new CapyError("invalid_request", "远程附件重定向次数过多");
}

async function readLimitedBody(response: Response, name: string): Promise<Uint8Array> {
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_ATTACHMENT_BYTES) {
    throw new CapyError("invalid_request", `附件 ${name} 超过 250 MB（单文件上限）`);
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_ATTACHMENT_BYTES) {
        await reader.cancel().catch(() => {});
        throw new CapyError("invalid_request", `附件 ${name} 超过 250 MB（单文件上限）`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function readRemote(
  fetchImpl: typeof fetch,
  raw: string,
  name: string,
  signal?: AbortSignal,
): Promise<ResolvedAttachment> {
  const timeout = timeoutSignal(signal);
  try {
    let response: Response;
    try {
      response = await fetchWithSafeRedirects(fetchImpl, raw, timeout.signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error instanceof CapyError) throw error;
      throw new CapyError("upstream_unavailable", "下载远程附件失败", { cause: error });
    }
    if (!response.ok) {
      throw new CapyError("invalid_request", `下载远程附件失败（HTTP ${response.status}）`);
    }
    const mediaType = mediaTypeOf(response.headers.get("content-type"));
    const bytes = await readLimitedBody(response, name);
    assertSize(bytes, name);
    return {
      candidate: { name, mediaType, bytes },
      marker: `${/^image\//u.test(mediaType) ? "[图片" : "[附件"}: ${name}]`,
    };
  } finally {
    timeout.cleanup();
  }
}

async function resolvePart(
  fetchImpl: typeof fetch,
  part: ImagePart | FilePart,
  index: number,
  signal?: AbortSignal,
): Promise<ResolvedAttachment> {
  const image = isImagePart(part);
  const fallbackType = image ? "image/png" : (part.mediaType ?? "application/octet-stream");
  const source = image ? part.url : (part.data ?? part.url ?? "");
  const name = safeName(part.name, fallbackType, index);
  if (!source) throw new CapyError("invalid_request", "附件缺少内容（data URL / http(s) URL / base64）");

  if (source.startsWith("data:")) {
    const decoded = decodeDataUrl(source, fallbackType);
    assertSize(decoded.bytes, name);
    const marker = `${/^image\//u.test(decoded.mediaType) ? "[图片" : "[附件"}: ${name}]`;
    return { candidate: { name, mediaType: decoded.mediaType, bytes: decoded.bytes }, marker };
  }
  if (/^https?:\/\//iu.test(source)) {
    return readRemote(fetchImpl, source, name, signal);
  }
  const text = source.trim();
  if (BARE_BASE64.test(text) && text.length % 4 === 0) {
    const bytes = Buffer.from(text, "base64");
    assertSize(bytes, name);
    const marker = `${/^image\//u.test(fallbackType) ? "[图片" : "[附件"}: ${name}]`;
    return { candidate: { name, mediaType: fallbackType, bytes }, marker };
  }
  throw new CapyError("invalid_request", "附件内容不是 data URL / http(s) URL / base64");
}

/**
 * OpenAI content parts → 文本 messages + 待上传附件。
 * 远程附件并发下载；每个 part 保持原顺序落位。
 */
export async function collectAttachments(
  messages: readonly ChatMessage[],
  options: { readonly fetchImpl: typeof fetch; readonly signal?: AbortSignal },
): Promise<{ messages: ChatMessage[]; attachments: UploadCandidate[] }> {
  const plans: {
    readonly message: number;
    readonly part: number;
    readonly value: ContentPart;
    readonly attachmentIndex: number;
  }[] = [];
  let attachmentIndex = 0;

  for (let mi = 0; mi < messages.length; mi += 1) {
    const message = messages[mi];
    if (!message || typeof message.content === "string") continue;
    for (let pi = 0; pi < message.content.length; pi += 1) {
      const part = message.content[pi];
      if (!part || isTextPart(part)) continue;
      if (!isImagePart(part) && !isFilePart(part)) continue;
      plans.push({ message: mi, part: pi, value: part, attachmentIndex });
      attachmentIndex += 1;
    }
  }

  const resolved = await Promise.all(plans.map((plan) =>
    resolvePart(options.fetchImpl, plan.value as ImagePart | FilePart, plan.attachmentIndex, options.signal)
  ));
  const byPart = new Map<string, ResolvedAttachment>();
  for (let i = 0; i < plans.length; i += 1) {
    const plan = plans[i];
    const value = resolved[i];
    if (plan && value) byPart.set(`${plan.message}:${plan.part}`, value);
  }

  const cleaned: ChatMessage[] = [];
  for (let mi = 0; mi < messages.length; mi += 1) {
    const message = messages[mi];
    if (!message) continue;
    if (typeof message.content === "string") {
      cleaned.push(message);
      continue;
    }
    const parts: ContentPart[] = [];
    for (let pi = 0; pi < message.content.length; pi += 1) {
      const part = message.content[pi];
      if (!part) continue;
      if (isTextPart(part)) {
        parts.push(part);
        continue;
      }
      const hit = byPart.get(`${mi}:${pi}`);
      if (hit) parts.push({ type: "text", text: hit.marker });
    }
    cleaned.push({ ...message, content: parts });
  }

  return { messages: cleaned, attachments: resolved.map((item) => item.candidate) };
}
