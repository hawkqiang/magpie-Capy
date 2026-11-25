import { FileThreadStore } from "../adapters/platform/file-thread-store.ts";
import { providerMetadata } from './provider-metadata.ts';
import { bridgeResponse } from './bridge-response.ts';
import { STATIC_CATALOG } from "../adapters/capy/static-catalog.ts";
import { CapyAppClient } from "../adapters/capy/app-client.ts";
import { CapyLoginSources } from "../adapters/capy/browser-login.ts";
import { HeadlessDeviceRuntime, FileSecretStore } from "../adapters/capy/device-tunnel.ts";
import { CAPY_ORIGIN, CAPY_PUBLIC } from "../adapters/capy/endpoints.ts";
import { CapyPublicClient } from "../adapters/capy/public-client.ts";
import { ConsoleLogger } from "../adapters/platform/console-logger.ts";
import { MemoryCache } from "../adapters/platform/memory-cache.ts";
import { createProxyFetch, resolveProxyUrl } from "../adapters/platform/proxy-fetch.ts";
import { readJsonBody } from "../adapters/platform/http.ts";
import { SystemClock } from "../adapters/platform/system-clock.ts";
import { SystemIds } from "../adapters/platform/ulid.ts";
import { authRecordOf, sessionOfAuth } from "../adapters/host/magpie-auth.ts";
import { modelMap, staticModels, type MagpieModel } from "./magpie-models.ts";
import { collectAttachments } from "../application/attachments.ts";
import { DeviceUseCase } from "../application/device.ts";
import { CatalogUseCase } from "../application/catalog.ts";
import { ChatUseCase } from "../application/chat.ts";
import { LoginUseCase } from "../application/login.ts";
import { PromptToolBridge } from "../application/tools.ts";
import { UsageUseCase, withDeviceWindow } from "../application/usage.ts";
import { SESSION_TTL_MS, accountKey, type AccountSession } from "../domain/account.ts";
import type { ChatRequest } from "../domain/chat.ts";
import { CapyError } from "../domain/errors.ts";
import { reasoningModeOf, resolveModel } from "../domain/model.ts";
import type { LoginCredential } from "../ports/login.ts";
import {
  encodeChatStream,
  encodeCompletion,
  encodeErrorResponse,
  encodeModelList,
  collectText,
  collectReply,
  parseChatRequest,
} from "../protocol/openai.ts";
import { reflectionPrompt, reflectionTools, REFLECT_ASK, REFLECT_DONE } from "../application/reflection.ts";

const DEFAULT_PROVIDER_ID = "capy";
const SDK = "@ai-sdk/openai-compatible";
const MAX_CONCURRENCY = 2;
const REFRESH_LEAD_MS = 24 * 3600_000;

interface PluginOptions {
  readonly providerId?: string;
  readonly toolsEnabled?: boolean;
  /** 线程复用开关；设为 false 时每次请求新建 Capy 线程（旧行为）。 */
  readonly threadReuse?: boolean;
  readonly proxy?: string | false;
  readonly promptVariant?: "auto" | "minimal" | "default";
}

function loginErrorText(error: unknown): string {
  if (error instanceof CapyError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

export default async function CapyPlugin(
  _ctx: unknown = {},
  options: PluginOptions = {},
): Promise<Record<string, unknown>> {
  const providerId = String(options.providerId || process.env.MAGPIE_CAPY_PROVIDER_ID || DEFAULT_PROVIDER_ID).trim();
  const toolsEnabled = options.toolsEnabled !== false;
  const configuredVariant = String(
    options.promptVariant ?? process.env.MAGPIE_CAPY_PROMPT_VARIANT ?? "auto",
  ).trim().toLowerCase();
  const minimalUnsupported = new Set<string>();
  const minimalAllowed = configuredVariant !== "default" && configuredVariant !== "off";

  const proxyUrl = resolveProxyUrl({
    ...(options.proxy === undefined ? {} : { proxy: options.proxy }),
  });
  const fetchImpl = createProxyFetch(fetch, proxyUrl, {
    onWarn: (message) => console.warn(`[magpie-capy] ${message}`),
  });

  const clock = new SystemClock();
  const ids = new SystemIds();
  const logger = new ConsoleLogger("capy");
  if (proxyUrl) {
    let host = "configured";
    try { const parsed = new URL(proxyUrl); host = `${parsed.hostname}:${parsed.port || "default"}`; } catch {}
    logger.event("proxy_enabled", { proxy: host });
  }
  const cache = new MemoryCache(() => clock.now());
  const app = new CapyAppClient(fetchImpl);
  const publicApi = new CapyPublicClient(fetchImpl);
  const store = new FileSecretStore();
  const runtime = new HeadlessDeviceRuntime({
    app,
    store,
    clock,
    logger,
  });
  const device = new DeviceUseCase(runtime);
  const login = new LoginUseCase({ app, sources: new CapyLoginSources() });
  const catalog = new CatalogUseCase({
    publicPort: publicApi,
    fallback: STATIC_CATALOG,
    toolsEnabled,
    cache,
  });
  const usage = new UsageUseCase({ publicApi, cache });
  const tools = new PromptToolBridge();
  const chat = new ChatUseCase({
    app,
    publicApi,
    device,
    ids,
    clock,
    tools,
    toolsEnabled,
    threadReuse: options.threadReuse !== false && process.env.MAGPIE_CAPY_THREAD_REUSE !== "0",
    threadStore: new FileThreadStore(),
    ...(process.env.MAGPIE_CAPY_TOOL_DIAGNOSTICS === "1"
      ? { onDiagnostic: (name: string, fields: Record<string, string | number | boolean>) => logger.event(name, fields) }
      : {}),
  });
  const initialModels = staticModels(providerId, toolsEnabled);

  async function modelsFor(session: AccountSession): Promise<Record<string, MagpieModel>> {
    try {
      const snapshot = await catalog.load(session.accessToken, undefined, accountKey(session));
      return modelMap(snapshot.models, providerId);
    } catch (error) {
      if (error instanceof CapyError && error.kind === "sign_in_required") throw error;
      return initialModels;
    }
  }

  async function complete(credential: LoginCredential): Promise<Record<string, unknown>> {
    return authRecordOf(await login.complete(credential));
  }

  function oauthMethod(options: {
    readonly label: string;
    readonly instructions: string;
    readonly url: string;
    readonly start: (signal: AbortSignal) => Promise<AccountSession>;
  }) {
    return {
      type: "oauth" as const,
      label: options.label,
      async authorize() {
        const controller = new AbortController();
        const probe = options.start(controller.signal).then((session) => authRecordOf(session));
        probe.catch(() => {});
        return {
          url: options.url,
          opened: true,
          method: "auto",
          instructions: options.instructions,
          close: () => controller.abort(),
          async callback(
            _value: unknown,
            callbackOptions: { signal?: AbortSignal } = {},
          ) {
            const onAbort = () => controller.abort();
            callbackOptions.signal?.addEventListener("abort", onAbort, { once: true });
            try {
              return await probe;
            } catch (error) {
              return { type: "failed", error: loginErrorText(error) };
            } finally {
              callbackOptions.signal?.removeEventListener("abort", onAbort);
              controller.abort();
            }
          },
        };
      },
    };
  }

  return {
    config: (cfg: Record<string, unknown>) => {
      const providers = (cfg.provider ??= {}) as Record<string, unknown>;
      providers[providerId] ??= {
        name: "Capy",
        npm: SDK,
        api: CAPY_PUBLIC,
        models: initialModels,
        searches: false,
      };
    },

    auth: {
      provider: providerId,
      maxConcurrency: MAX_CONCURRENCY,
      refreshLead: REFRESH_LEAD_MS,
      methods: [
        oauthMethod({
          label: "从本机 Capy 客户端导入（只登录，不需要运行桌面端）",
          url: CAPY_ORIGIN,
          instructions: "正在读取本机 Capy 登录态（只读登录凭据，不需要启动 Capy 桌面端）…",
          start: (signal) => login.login("local", signal),
        }),
        oauthMethod({
          label: "浏览器登录（Google / GitHub / Passkey / 邮箱）",
          url: `${CAPY_ORIGIN}/sign-in`,
          instructions:
            "已打开 Capy 官方登录页。用 Google、GitHub、Passkey 或邮箱登录；"
            + "登录成功后会自动读取登录态，不需要复制任何东西。",
          start: (signal) => login.login("browser", signal),
        }),
      ],

      async refresh(auth: Record<string, unknown>) {
        let session: AccountSession;
        try {
          session = sessionOfAuth(auth);
        } catch {
          throw Object.assign(new Error("Capy 登录已失效，请重新登录"), { signIn: "expired" });
        }
        try {
          await publicApi.listModels(session.accessToken);
          return { access: session.accessToken, expires: Date.now() + SESSION_TTL_MS };
        } catch (error) {
          if (!(error instanceof CapyError) || error.kind !== "sign_in_required") return undefined;
        }
        try {
          const renewed = await complete({
            clientJwt: session.clerk.clientJwt,
            sessionId: session.clerk.sessionId,
            userId: session.uid,
            orgId: session.orgId,
            clientId: session.clientId,
            source: "refresh",
          });
          return {
            access: typeof renewed.access === "string" ? renewed.access : "",
            expires: typeof renewed.expires === "number" ? renewed.expires : Date.now() + SESSION_TTL_MS,
          };
        } catch {
          throw Object.assign(new Error("Capy 登录已失效，请重新登录"), { signIn: "expired" });
        }
      },

      async loader(getAuth: () => Promise<Record<string, unknown> | null>) {
        return {
          baseURL: CAPY_PUBLIC,
          apiKey: "",
          headers: {},
          async fetch(input: Request | string | URL, init: RequestInit = {}): Promise<Response> {
            const auth = await getAuth();
            let session: AccountSession;
            try {
              session = sessionOfAuth(auth);
            } catch (error) {
              return encodeErrorResponse(error);
            }
            const request = input instanceof Request ? input : null;
            const url = typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : request?.url ?? "";
            const method = String(init.method ?? request?.method ?? "GET").toUpperCase();
            const route = url.split("?")[0] ?? "";
            const signal = init.signal ?? request?.signal ?? undefined;

            try {
              if (method === "GET" && /\/models$/u.test(route)) {
                const models = await modelsFor(session);
                return encodeModelList(
                  Object.values(models).map((model) => ({ id: model.id, name: model.name })),
                  providerId,
                );
              }
              if (!/\/chat\/completions$/u.test(route)) {
                return encodeErrorResponse(new CapyError("not_implemented", `该端点没有实现：${method} ${url}`));
              }

              let body: unknown;
              try {
                body = await readJsonBody(input, init);
              } catch {
                return encodeErrorResponse(new CapyError("invalid_request", "请求体不是合法 JSON"));
              }
              if (process.env.MAGPIE_CAPY_TOOL_DIAGNOSTICS === "1") {
                logger.event("provider.tools", providerMetadata(body));
              }
              const requestBody: ChatRequest = parseChatRequest(body);
              if (!toolsEnabled && (requestBody.toolChoice === "required" || typeof requestBody.toolChoice === "object")) {
                throw new CapyError("invalid_request", "工具桥已关闭，无法满足 tool_choice");
              }
              const snapshot = await catalog.load(session.accessToken, signal, accountKey(session));
              const model = resolveModel(requestBody.model, snapshot.models);
              const modelId = model.id;
              const reasoningMode = reasoningModeOf(requestBody, model);
              const prepared = await collectAttachments(requestBody.messages, {
                fetchImpl,
                ...(signal ? { signal } : {}),
              });
              const files = prepared.attachments.length > 0
                ? await publicApi.uploadFiles(session.accessToken, prepared.attachments, signal)
                : [];
              let activeThreadId = "";
              const onAbort = () => {
                if (activeThreadId) void chat.cancel(session, activeThreadId);
              };
              signal?.addEventListener("abort", onAbort, { once: true });
              const events = chat.stream(session, {
                ...requestBody,
                messages: prepared.messages,
              }, {
                ...(signal ? { signal } : {}),
                ...(reasoningMode ? { reasoningMode } : {}),
                ...(files.length > 0 ? { files } : {}),
                onThread: (thread) => { activeThreadId = thread.id; },
                onVariantFallback: () => { minimalUnsupported.add(accountKey(session)); },
                ...(minimalAllowed && !minimalUnsupported.has(accountKey(session))
                  ? { promptVariant: "minimal" as const }
                  : {}),
              });
              const meta = {
                id: `chatcmpl-${ids.ulid()}`,
                model: modelId,
                created: Math.floor(clock.now() / 1000),
              };

              if (toolsEnabled && requestBody.tools?.length && requestBody.toolChoice !== "none") {
                return await bridgeResponse(
                  requestBody,
                  events,
                  meta,
                  tools,
                  () => `call_${ids.ulid()}`,
                  // 只报计数与布尔值：验收时用来区分“模型照契约返回调用”与“上游自己执行了工具”。
                  (outcome) => {
                    if (process.env.MAGPIE_CAPY_TOOL_DIAGNOSTICS === "1") {
                      logger.event("provider.tools.outcome", { ...outcome });
                    }
                  },
                  () => activeThreadId,
                  async (req: import("../domain/chat.ts").ChatRequest, replyText: string) => {
                    // 完成反思：跟随当前模型的强制二选一请求；不复用工具回合线程。
                    const reflectEvents = chat.stream(session, {
                      model: req.model,
                      stream: false,
                      tools: reflectionTools(),
                      toolChoice: "required",
                      messages: [{ role: "user", content: reflectionPrompt(req, replyText) }],
                    }, { ...(signal ? { signal } : {}), onThread: thread => { activeThreadId = thread.id; } });
                    const reflected = await collectReply(reflectEvents);
                    if (!reflected.committed) return null;
                    const parsed = new PromptToolBridge().parse(reflected.text, reflectionTools(), "required");
                    const call = parsed?.calls?.[0];
                    if (!call) return null;
                    if (call.name === REFLECT_ASK) {
                      const args = JSON.parse(call.arguments);
                      const questions = Array.isArray(args?.questions) ? args.questions : [];
                      if (!questions.length || !questions.every((q: { id?: unknown; question?: unknown }) =>
                        q && typeof q.id === "string" && typeof q.question === "string" && q.question.trim())) return null;
                      return { name: REFLECT_ASK, arguments: call.arguments };
                    }
                    if (call.name === REFLECT_DONE) return null;
                    return null;
                  },
                );
              }
              if (requestBody.stream) return encodeChatStream(events, meta);
              return encodeCompletion(meta.id, meta.model, meta.created, await collectText(events));
            } catch (error) {
              return encodeErrorResponse(error);
            }
          },
        };
      },

      async usage(getAuth: () => Promise<Record<string, unknown> | null>) {
        let session: AccountSession;
        try {
          session = sessionOfAuth(await getAuth());
        } catch {
          return { error: "未登录", windows: [] };
        }
        try {
          const snapshot = await usage.load(session.accessToken, undefined, accountKey(session));
          let deviceWindow: { connected: boolean; name: string } = { connected: false, name: "" };
          try {
            const info = await device.ensure(session);
            deviceWindow = { connected: true, name: info.name };
          } catch {
            deviceWindow = { connected: false, name: "" };
          }
          return withDeviceWindow(snapshot, deviceWindow);
        } catch (error) {
          if (error instanceof CapyError && error.kind === "sign_in_required") {
            return { error: "Capy 登录已失效，请重新登录", windows: [], signIn: "expired" };
          }
          return { error: loginErrorText(error), windows: [] };
        }
      },
    },

    provider: {
      id: providerId,
      async models(_fallback: unknown, context: { auth?: Record<string, unknown> } = {}) {
        try {
          return await modelsFor(sessionOfAuth(context.auth));
        } catch {
          return initialModels;
        }
      },
    },
  };
}
