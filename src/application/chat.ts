import type { AccountSession } from "../domain/account.ts";
import { accountKey } from "../domain/account.ts";
import type { ChatEvent, ChatRequest, ToolCall } from "../domain/chat.ts";
import { buildPrompt } from "../domain/chat.ts";
import { incrementalPrompt, threadKey } from "../domain/thread.ts";
import { isAdsModel } from "../domain/model.ts";
import { CapyError, errorText, isAbort, mapCapyCode } from "../domain/errors.ts";
import type { JamCreated, JamDetail, JamFile } from "../ports/capy-app.ts";
import type { CapyAppPort } from "../ports/capy-app.ts";
import type { CapyPublicPort } from "../ports/capy-public.ts";
import type { ClockPort, IdPort } from "../ports/platform.ts";
import type { ToolBridgePort } from "../ports/tool-bridge.ts";
import { MemoryThreadStore, type ThreadStorePort } from "../ports/thread-store.ts";
import { mapInvocationToToolCall, subscribeJamInvocation } from "./capture.ts";
import { DeviceUseCase } from "./device.ts";
import { PublicSseNormalizer } from "./stream.ts";

export interface ChatUseCaseOptions {
  readonly app: CapyAppPort;
  readonly publicApi: CapyPublicPort;
  readonly device: DeviceUseCase;
  readonly ids: IdPort;
  readonly clock: ClockPort;
  readonly tools: ToolBridgePort;
  readonly toolsEnabled: boolean;
  /** 关闭后每次请求都新建线程（旧行为）；默认开启线程复用。 */
  readonly threadReuse?: boolean;
  readonly threadStore?: ThreadStorePort | undefined;
  readonly onDiagnostic?: ((name: string, fields: Record<string, string | number | boolean>) => void) | undefined;
}

export interface ChatRunOptions {
  readonly signal?: AbortSignal;
  readonly files?: readonly JamFile[];
  readonly reasoningMode?: string;
  readonly promptVariant?: "minimal";
  readonly onThread?: (thread: JamCreated) => void;
  readonly onVariantFallback?: () => void;
}

interface JwtCacheEntry {
  readonly jwt: string;
  readonly expiresAt: number;
}

interface MutableThread {
  threadId: string;
  cursor: string;
  model: string;
}

const JWT_TTL_MS = 50_000;

export class ChatUseCase {
  private readonly options: ChatUseCaseOptions;
  private readonly jwtCache = new Map<string, JwtCacheEntry>();
  private readonly tails = new Map<string, Promise<void>>();
  private readonly threadStore: ThreadStorePort;

  constructor(options: ChatUseCaseOptions) {
    this.options = options;
    this.threadStore = options.threadStore ?? new MemoryThreadStore();
  }

  async *stream(
    session: AccountSession,
    request: ChatRequest,
    run: ChatRunOptions = {},
  ): AsyncIterable<ChatEvent> {
    const key = threadKey(accountKey(session), request.model, request.messages);
    const release = await this.acquire(key);
    try {
      yield* this.streamLocked(session, request, run, key);
    } finally {
      release();
    }
  }

  /** 同一会话串行：Capy 线程一次只能跑一个 run，并发请求必须排队。 */
  private async acquire(key: string): Promise<() => void> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    this.tails.set(key, previous.then(() => gate));
    await previous;
    let done = false;
    return () => {
      if (done) return;
      done = true;
      release();
    };
  }

  private async *streamLocked(
    session: AccountSession,
    request: ChatRequest,
    run: ChatRunOptions,
    key: string,
  ): AsyncIterable<ChatEvent> {
    await this.options.device.ensure(session, run.signal);
    const hasTools = this.options.toolsEnabled
      && (request.tools?.length ?? 0) > 0
      && request.toolChoice !== "none";
    const toolInstruction = hasTools
      ? this.options.tools.instruction(request.tools ?? [], request.toolChoice)
      : "";
    const jwt = await this.sessionJwt(session, run.signal);

    // 带工具请求可能通过方案 B 中断短路，避免复用残留未完成工具状态的旧线程。
    const canReuse = this.options.threadReuse !== false && !hasTools;
    const loaded = canReuse ? this.threadStore.load(key) : null;
    const state: MutableThread | null = loaded
      ? { threadId: loaded.threadId, cursor: loaded.cursor, model: loaded.model }
      : null;
    this.options.onDiagnostic?.("chat.thread", {
      key,
      reused: Boolean(state),
      reuseEnabled: canReuse,
    });
    if (state) {
      const incremental = incrementalPrompt(request.messages);
      if (incremental) {
        const message = `${incremental}${toolInstruction ? `\n\n${toolInstruction}` : ""}`;
        try {
          await this.options.publicApi.sendMessage(
            session.accessToken,
            state.threadId,
            message,
            `msg_${this.options.ids.ulid()}`,
            run.signal,
          );
          yield* this.consume(session, state, key, jwt, run, canReuse, request, hasTools);
          return;
        } catch (error) {
          // 发送阶段还没产出任何事件：回滚后回退到新建线程。
          this.threadStore.remove(key);
          if (isAbort(error)) throw error;
        }
      }
    }

    const prompt = buildPrompt(request.messages, { toolInstruction });
    const create = async (promptVariant?: "minimal") => {
      const requestId = this.options.ids.ulid();
      const deviceInfo = await this.options.device.ensure(session, run.signal);
      return await this.options.app.createJam(jwt, session.orgId, {
        jamId: `jam_${this.options.ids.ulid()}`,
        requestId,
        clientKey: requestId,
        message: prompt,
        modelId: request.model,
        deviceId: deviceInfo.id,
        ...(run.reasoningMode ? { reasoningMode: run.reasoningMode } : {}),
        ...(run.files && run.files.length > 0 ? { files: run.files } : {}),
        ...(promptVariant ? { promptVariant } : {}),
        ...(isAdsModel(request.model) ? { ads: true } : {}),
      }, run.signal);
    };

    let thread: JamCreated;
    try {
      thread = await create(run.promptVariant);
    } catch (error) {
      if (run.promptVariant === "minimal" && error instanceof CapyError && error.status === 403) {
        run.onVariantFallback?.();
        thread = await create();
      } else {
        throw error;
      }
    }
    if (thread.primaryMachine.kind !== "device") {
      throw new CapyError(
        "upstream_unavailable",
        "Capy 没有把线程放到无头设备（返回了云端机器）",
      );
    }
    run.onThread?.(thread);
    const fresh: MutableThread = { threadId: thread.id, cursor: "", model: request.model };

    const detail = await this.options.app.getJam(jwt, session.orgId, thread.id, run.signal)
      .catch(() => null);
    const blocked = askError(detail);
    if (blocked) {
      this.options.onDiagnostic?.("chat.blocked", { key, reason: blocked.kind });
      throw blocked;
    }

    yield* this.consume(session, fresh, key, jwt, run, canReuse, request, hasTools);
  }

  /** 共用 SSE 消费：记录 transcript cursor 供下次复用时跳过旧记录；工具回合支持按 jamId 即时短路。 */
  private async *consume(
    session: AccountSession,
    state: MutableThread,
    key: string,
    jwt: string,
    run: ChatRunOptions,
    persistThread: boolean,
    request: ChatRequest,
    hasTools: boolean,
  ): AsyncIterable<ChatEvent> {
    const normalizer = new PublicSseNormalizer();
    let shortCircuitedCall: Omit<ToolCall, "id"> | null = null;
    const streamController = new AbortController();
    const onParentAbort = () => streamController.abort();
    if (run.signal) {
      if (run.signal.aborted) streamController.abort();
      else run.signal.addEventListener("abort", onParentAbort, { once: true });
    }
    const unsubscribe = hasTools
      ? subscribeJamInvocation(state.threadId, (inv) => {
          if (shortCircuitedCall) return;
          const mapped = mapInvocationToToolCall(inv, request.tools ?? [], request.toolChoice);
          if (!mapped) return;
          shortCircuitedCall = mapped;
          streamController.abort();
          void this.cancel(session, state.threadId);
        })
      : undefined;

    try {
      if (shortCircuitedCall) {
        this.options.onDiagnostic?.("chat.shortcircuit", {
          key,
          threadId: state.threadId,
          phase: "buffered",
        });
        yield {
          type: "final",
          text: "",
          committed: true,
          internalTools: true,
          capturedCalls: [shortCircuitedCall],
        };
        yield { type: "done" };
        return;
      }

      for await (const frame of this.options.publicApi.streamThread(
        session.accessToken,
        state.threadId,
        streamController.signal,
        state.cursor || undefined,
      )) {
        if (shortCircuitedCall) break;
        if (frame.id) state.cursor = frame.id;
        for (const event of normalizer.push(frame)) yield event;
      }

      if (shortCircuitedCall && !run.signal?.aborted) {
        this.options.onDiagnostic?.("chat.shortcircuit", {
          key,
          threadId: state.threadId,
          phase: "loop_end",
        });
        yield {
          type: "final",
          text: "",
          committed: true,
          internalTools: true,
          capturedCalls: [shortCircuitedCall],
        };
        yield { type: "done" };
        return;
      }

      this.options.onDiagnostic?.("chat.consume", {
        key,
        threadId: state.threadId,
        cursor: state.cursor,
        text: normalizer.text ? "yes" : "no",
        hasError: normalizer.hasError,
      });
      if (!normalizer.text && !normalizer.hasError) {
        const failure = await this.jamFailure(jwt, session.orgId, state.threadId, run.signal);
        if (failure) {
          this.threadStore.remove(key);
          yield { type: "error", error: failure };
          return;
        }
      }
      // 成功：仅在允许复用的纯文本场景下持久化线程引用与 cursor。
      if (persistThread) {
        this.threadStore.save(key, {
          threadId: state.threadId,
          cursor: state.cursor,
          model: state.model,
          updatedAt: Date.now(),
        });
      }
      for (const event of normalizer.finish()) yield event;
    } catch (error) {
      if (shortCircuitedCall && !run.signal?.aborted) {
        this.options.onDiagnostic?.("chat.shortcircuit", {
          key,
          threadId: state.threadId,
          phase: "stream",
        });
        yield {
          type: "final",
          text: "",
          committed: true,
          internalTools: true,
          capturedCalls: [shortCircuitedCall],
        };
        yield { type: "done" };
        return;
      }
      this.options.onDiagnostic?.("chat.consume.error", {
        key,
        error: error instanceof Error ? error.message.slice(0, 120) : "unknown",
      });
      this.threadStore.remove(key);
      if (error instanceof CapyError) {
        yield { type: "error", error };
        return;
      }
      if (isAbort(error)) throw error;
      yield {
        type: "error",
        error: new CapyError("upstream_unavailable", errorText(error), { cause: error }),
      };
    } finally {
      unsubscribe?.();
      run.signal?.removeEventListener("abort", onParentAbort);
    }
  }

  private async jamFailure(
    jwt: string,
    orgId: string,
    jamId: string,
    signal?: AbortSignal,
  ): Promise<CapyError | null> {
    const detail = await this.options.app.getJam(jwt, orgId, jamId, signal).catch((error: unknown) => {
      throw error instanceof CapyError
        ? error
        : new CapyError("upstream_unavailable", `查询 Capy 线程状态失败：${errorText(error)}`, { cause: error });
    });
    const blocked = askError(detail);
    if (blocked) return blocked;
    if (detail.status !== "failed") return null;
    const events = await this.options.app.getJamEvents(jwt, orgId, jamId, signal).catch(() => []);
    for (const event of [...events].reverse()) {
      if (event.kind !== "error") continue;
      const code = event.payload?.code ?? "";
      const message = event.payload?.message ?? "Capy 线程失败";
      return mapCapyCode(code, message);
    }
    return new CapyError("upstream_error", "Capy 线程失败，但没有返回错误详情");
  }

  async cancel(session: AccountSession, jamId: string): Promise<void> {
    try {
      const jwt = await this.sessionJwt(session);
      await this.options.app.interruptJam(jwt, session.orgId, jamId);
    } catch {
      // best-effort
    }
  }

  private async sessionJwt(session: AccountSession, signal?: AbortSignal): Promise<string> {
    const key = `${accountKey(session)}:${session.clerk.sessionId}`;
    const now = this.options.clock.now();
    for (const [cachedKey, entry] of this.jwtCache) {
      if (entry.expiresAt <= now) this.jwtCache.delete(cachedKey);
    }
    const hit = this.jwtCache.get(key);
    if (hit) return hit.jwt;
    const jwt = await this.options.app.sessionJwt(session.clerk, signal);
    this.jwtCache.set(key, { jwt, expiresAt: this.options.clock.now() + JWT_TTL_MS });
    return jwt;
  }
}

function askError(detail: JamDetail | null): CapyError | null {
  const ask = detail?.ask;
  if (!ask) return null;
  if (ask.kind === "credits") {
    return new CapyError("insufficient_quota", ask.text || "Capy 额度不足");
  }
  if (ask.kind === "desktop") {
    return new CapyError("upstream_unavailable", ask.text || "Capy 线程需要人工/桌面端操作");
  }
  return new CapyError("upstream_error", ask.text || `Capy 线程阻塞：${ask.kind}`);
}
