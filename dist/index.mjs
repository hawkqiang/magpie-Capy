// @bun
var __require = import.meta.require;

// src/adapters/capy/static-catalog.ts
var STATIC_CATALOG = [
  {
    id: "anthropic/claude-fable-5",
    name: "Claude Fable 5",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-fable-5-1",
    name: "Claude Fable 5.1",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-fable-5-2",
    name: "Claude Fable 5.2",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    reasoningModes: [
      "none",
      "instant",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-4-5",
    name: "Claude Opus 4.5",
    reasoningModes: [
      "none",
      "instant",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-4-6",
    name: "Claude Opus 4.6",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-4-7",
    name: "Claude Opus 4.7",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-4-8",
    name: "Claude Opus 4.8",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-5",
    name: "Claude Opus 5",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-opus-5-5",
    name: "Claude Opus 5.5",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "max"
    ]
  },
  {
    id: "anthropic/claude-sonnet-5",
    name: "Claude Sonnet 5",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "anthropic/claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    name: "DeepSeek V4 Flash 0731",
    reasoningModes: [
      "none",
      "low",
      "high",
      "max"
    ]
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    reasoningModes: [
      "none",
      "high",
      "max"
    ]
  },
  {
    id: "deepseek/deepseek-v4.1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    reasoningModes: [
      "none",
      "low",
      "high",
      "max"
    ]
  },
  {
    id: "google/gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    reasoningModes: [
      "minimal",
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "google/gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    reasoningModes: [
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    reasoningModes: [
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "google/gemini-4-argon",
    name: "Gemini 4 Argon",
    reasoningModes: [
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "google/gemini-4-carbon",
    name: "Gemini 4 Carbon",
    reasoningModes: [
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "google/gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "google/gemini-4-neon",
    name: "Gemini 4 Neon",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "meituan/longcat-2.0",
    name: "LongCat-2.0",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "meta/muse-glimmer-30b",
    name: "Muse Glimmer 30B",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "meta/muse-spark-1.3",
    name: "Muse Spark 1.3",
    reasoningModes: [
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "minimax/minimax-m3",
    name: "MiniMax M3",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "minimax/minimax-m3.1-flash",
    name: "MiniMax M3.1 Flash",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "moonshotai/kimi-k3",
    name: "Kimi K3",
    reasoningModes: [
      "none",
      "low",
      "high",
      "max"
    ]
  },
  {
    id: "moonshotai/kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    reasoningModes: [
      "none",
      "low",
      "high",
      "max"
    ]
  },
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    name: "Nemotron 3.5 Super VL",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "openai/gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "openai/gpt-5.4",
    name: "GPT-5.4",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "openai/gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "openai/gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    reasoningModes: [
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6-astra",
    name: "GPT-6 Astra",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6-luna",
    name: "GPT-6 Luna",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6-sol",
    name: "GPT-6 Sol",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6.2-astra",
    name: "GPT-6.2 Astra",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "openai/gpt-6.2-sol",
    name: "GPT-6.2 Sol",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "particle/particle-1",
    name: "Particle-1",
    reasoningModes: [
      "none",
      "low",
      "medium",
      "high"
    ]
  },
  {
    id: "qwen/qwen3.8-flash",
    name: "Qwen3.8 Flash",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "qwen/qwen3.8-max",
    name: "Qwen3.8 Max",
    reasoningModes: [
      "low",
      "medium",
      "xhigh"
    ]
  },
  {
    id: "tencent/hy3",
    name: "Hy3",
    reasoningModes: [
      "none",
      "low",
      "high"
    ]
  },
  {
    id: "tencent/hy4",
    name: "Hy4",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "tencent/hy4-preview",
    name: "Hy4 Preview",
    reasoningModes: [
      "none",
      "low",
      "high"
    ]
  },
  {
    id: "thinkingmachines/inkling-2-small",
    name: "Inkling 2 Small",
    reasoningModes: [
      "none",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ]
  },
  {
    id: "xai/grok-4.5",
    name: "Grok 4.5",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "xai/grok-4.6",
    name: "Grok 4.6",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "xai/grok-4.7",
    name: "Grok 4.7",
    reasoningModes: [
      "low",
      "medium",
      "high",
      "xhigh"
    ]
  },
  {
    id: "xiaomi/mimo-v2.6-flash",
    name: "MiMo-V2.6 Flash",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "xiaomi/mimo-v2.6-pro",
    name: "MiMo-V2.6 Pro",
    reasoningModes: [
      "none"
    ]
  },
  {
    id: "zai/glm-5.3",
    name: "GLM-5.3",
    reasoningModes: [
      "low",
      "high",
      "max"
    ]
  },
  {
    id: "zai/glm-5.3-flash",
    name: "GLM-5.3-Flash",
    reasoningModes: [
      "low",
      "high",
      "max"
    ]
  }
];

// src/domain/errors.ts
var STATUS = {
  invalid_request: 400,
  not_found: 404,
  model_not_found: 404,
  sign_in_required: 401,
  insufficient_quota: 402,
  region_unsupported: 403,
  device_pair_failed: 403,
  rate_limited: 429,
  upstream_unavailable: 503,
  upstream_timeout: 504,
  upstream_error: 502,
  internal_error: 502,
  not_implemented: 501
};
var RETRYABLE = new Set([
  "rate_limited",
  "upstream_unavailable",
  "upstream_timeout"
]);

class CapyError extends Error {
  kind;
  status;
  retryable;
  detail;
  constructor(kind, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = "CapyError";
    this.kind = kind;
    this.status = options.status ?? STATUS[kind];
    this.retryable = options.retryable ?? RETRYABLE.has(kind);
    this.detail = options.detail;
  }
}
function isCapyError(value) {
  return value instanceof CapyError;
}
function isAuthError(value) {
  return isCapyError(value) && value.kind === "sign_in_required";
}
function isAbort(error) {
  return Boolean(error && typeof error === "object" && error.name === "AbortError");
}
function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}
function mapCapyCode(code, message) {
  if (code === "region_unsupported") {
    return new CapyError("region_unsupported", message, { detail: code });
  }
  if (code === "unauthorized") {
    return new CapyError("sign_in_required", message, { detail: code });
  }
  if (code === "forbidden") {
    return new CapyError("upstream_error", message, { status: 403, detail: code });
  }
  if (code === "rate_limited") {
    return new CapyError("rate_limited", message, { detail: code });
  }
  if (/quota|credit/iu.test(code)) {
    return new CapyError("insufficient_quota", message, { detail: code });
  }
  if (/ModelSelection/iu.test(code)) {
    return new CapyError("model_not_found", message, { detail: code });
  }
  return new CapyError("upstream_error", message, { detail: code });
}
function mapUpstream(status, body, fallback = "") {
  const tag = tagOf(body);
  const message = messageOf(body) || fallback || `Capy upstream error (HTTP ${status})`;
  if (status === 401 || tag === "capy/Unauthorized") {
    return new CapyError("sign_in_required", "Capy \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", { detail: message });
  }
  if (status === 402 || tag === "capy/PaidFeatureUnavailable") {
    return new CapyError("insufficient_quota", message || "Capy \u989D\u5EA6\u4E0D\u8DB3", { detail: tag });
  }
  if (status === 403 || tag === "capy/Forbidden") {
    return new CapyError("upstream_error", message || "Capy \u62D2\u7EDD\u4E86\u8FD9\u4E2A\u8BF7\u6C42", { status: 403, detail: tag });
  }
  if (status === 429 || tag === "capy/RateLimited") {
    return new CapyError("rate_limited", message || "Capy \u9650\u6D41", { detail: tag });
  }
  if (status === 404 || tag.endsWith("NotFound")) {
    const kind = /model/iu.test(tag) ? "model_not_found" : "not_found";
    return new CapyError(kind, message || "Capy \u8D44\u6E90\u4E0D\u5B58\u5728", { detail: tag });
  }
  if (status === 400 && /ModelSelection/iu.test(tag)) {
    return new CapyError("model_not_found", message || "Capy \u4E0D\u63A5\u53D7\u8FD9\u4E2A\u6A21\u578B", { detail: tag });
  }
  if (status === 400) {
    return new CapyError("invalid_request", message || "Capy \u8BA4\u4E3A\u8BF7\u6C42\u4E0D\u5408\u6CD5", { detail: tag });
  }
  if (status === 503 || tag === "capy/StreamUnavailable") {
    return new CapyError("upstream_unavailable", message || "Capy \u6D41\u670D\u52A1\u4E0D\u53EF\u7528", { detail: tag });
  }
  if (status >= 500) {
    return new CapyError("upstream_unavailable", message || `Capy \u4E0A\u6E38\u9519\u8BEF\uFF08HTTP ${status}\uFF09`, { detail: tag });
  }
  return new CapyError("upstream_error", message, { detail: tag });
}
function tagOf(body) {
  if (!body || typeof body !== "object")
    return "";
  const tag = body._tag;
  return typeof tag === "string" ? tag : "";
}
function messageOf(body) {
  if (!body || typeof body !== "object")
    return "";
  const message = body.message;
  return typeof message === "string" ? message.trim() : "";
}
function toOpenAiError(error) {
  const kind = isCapyError(error) ? error.kind : "internal_error";
  const status = isCapyError(error) ? error.status : 502;
  const message = error instanceof Error ? error.message : String(error);
  return {
    error: {
      message,
      type: openAiErrorType(status),
      code: kind,
      status
    }
  };
}
function openAiErrorType(status) {
  if (status === 401)
    return "authentication_error";
  if (status === 400 || status === 404 || status === 422)
    return "invalid_request_error";
  if (status === 429)
    return "rate_limit_error";
  return "upstream_error";
}

// src/adapters/platform/http.ts
async function requestJson(fetchImpl, url, init = {}, timeoutMs = 30000) {
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  const signal = init.signal;
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted)
      controller.abort();
    else
      signal.addEventListener("abort", onAbort, { once: true });
  }
  try {
    let response;
    try {
      response = await fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (signal?.aborted)
        throw error;
      if (controller.signal.aborted) {
        throw new CapyError("upstream_timeout", "\u8FDE\u63A5 Capy \u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC/\u4EE3\u7406\u540E\u91CD\u8BD5", { cause: error });
      }
      throw new CapyError("upstream_unavailable", `\u8FDE\u63A5 Capy \u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    return { response, body, text };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
async function requestCapyJson(fetchImpl, url, init = {}, timeoutMs = 30000) {
  const { response, body, text } = await requestJson(fetchImpl, url, init, timeoutMs);
  if (!response.ok)
    throw mapUpstream(response.status, body, text.slice(0, 300));
  return body;
}
async function readJsonBody(input, init) {
  if (typeof init.body === "string")
    return JSON.parse(init.body);
  if (init.body)
    return JSON.parse(await new Response(init.body).text());
  if (input instanceof Request)
    return JSON.parse(await input.text());
  return {};
}

// src/adapters/platform/jwt.ts
function decodeJwtPayload(token) {
  const part = token.split(".")[1];
  if (!part)
    return null;
  try {
    const value = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

// src/adapters/capy/endpoints.ts
var CAPY_ORIGIN = "https://capy.ai";
var CAPY_FAPI = "https://clerk.capy.ai";
var CAPY_APP = "https://api.capy.ai/app";
var CAPY_PUBLIC = "https://api.capy.ai/api/v1";
var DEVICE_TUNNEL = "wss://device-tunnel-production.cloud.capy.ai/tunnel";
var CONTRACT_VERSION = 2;
function appHeaders(jwt, extra = {}) {
  return {
    authorization: `Bearer ${jwt}`,
    origin: CAPY_ORIGIN,
    referer: `${CAPY_ORIGIN}/`,
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Capy/0.9.2 Chrome/140.0.0.0 Electron/45.2.3 Safari/537.36",
    "x-capy-client-surface": "desktop",
    "x-capy-client-features": "message-edit,visual",
    "x-capy-client-timezone": timezone(),
    ...extra
  };
}
function clientHeaders(jwt, extra = {}) {
  return appHeaders(jwt, extra);
}
function publicHeaders(apiKey, extra = {}) {
  return { authorization: `Bearer ${apiKey}`, accept: "application/json", ...extra };
}
function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// src/adapters/capy/clerk-client.ts
class ClerkClient {
  fetchImpl;
  constructor(fetchImpl = fetch) {
    this.fetchImpl = fetchImpl;
  }
  async sessionJwt(clerk, signal) {
    if (!clerk.clientJwt || !clerk.sessionId) {
      throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u51ED\u636E\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
    }
    const url = `${CAPY_FAPI}/v1/client/sessions/${encodeURIComponent(clerk.sessionId)}/tokens`;
    const { response, body, text } = await requestJson(this.fetchImpl, url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: CAPY_ORIGIN,
        cookie: `__client=${clerk.clientJwt}`
      },
      body: "{}",
      ...signal ? { signal } : {}
    }, 20000);
    if (!response.ok) {
      throw new CapyError("sign_in_required", `Capy \u4F1A\u8BDD\u6362\u7968\u5931\u8D25\uFF08HTTP ${response.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55`, { detail: text.slice(0, 200) });
    }
    const record = body;
    const jwt = typeof record?.jwt === "string" ? record.jwt : typeof record?.response?.jwt === "string" ? record.response.jwt : "";
    if (!jwt)
      throw new CapyError("upstream_error", "Capy \u4F1A\u8BDD\u6362\u7968\u6CA1\u6709\u8FD4\u56DE JWT");
    const payload = decodeJwtPayload(jwt);
    if (payload?.azp !== CAPY_ORIGIN) {
      throw new CapyError("sign_in_required", "Capy \u4F1A\u8BDD\u6362\u7968\u6CA1\u6709\u62FF\u5230 azp\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", {
        detail: `azp=${String(payload?.azp ?? "missing")}`
      });
    }
    return jwt;
  }
}

// src/adapters/capy/app-client.ts
function itemsOf(body) {
  if (Array.isArray(body))
    return body;
  if (body && typeof body === "object" && Array.isArray(body.items)) {
    return body.items;
  }
  return [];
}

class CapyAppClient {
  fetchImpl;
  clerk;
  constructor(fetchImpl = fetch, clerk = new ClerkClient(fetchImpl)) {
    this.fetchImpl = fetchImpl;
    this.clerk = clerk;
  }
  async sessionJwt(clerk, signal) {
    return this.clerk.sessionJwt(clerk, signal);
  }
  async me(jwt, signal) {
    const body = await this.json(jwt, "/me", { method: "GET", ...signal ? { signal } : {} });
    const record = body;
    const preferences = record.preferences;
    return {
      id: String(record.id ?? ""),
      ...typeof record.email === "string" ? { email: record.email } : {},
      ...typeof record.firstName === "string" ? { firstName: record.firstName } : {},
      ...typeof record.lastName === "string" ? { lastName: record.lastName } : {},
      ...preferences && typeof preferences === "object" && !Array.isArray(preferences) && typeof preferences.preferredOrgId === "string" ? { preferredOrgId: String(preferences.preferredOrgId) } : {}
    };
  }
  async organizations(jwt, signal) {
    const body = await this.json(jwt, "/organizations", { method: "GET", ...signal ? { signal } : {} });
    return itemsOf(body).flatMap((item) => {
      if (!item || typeof item !== "object")
        return [];
      const record = item;
      const id = typeof record.id === "string" ? record.id : "";
      if (!id)
        return [];
      return [{ id, ...typeof record.name === "string" ? { name: record.name } : {} }];
    });
  }
  async mintApiKey(jwt, orgId, name, signal) {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/api-keys`, {
      method: "POST",
      body: JSON.stringify({ name }),
      ...signal ? { signal } : {}
    });
    const record = body;
    const key = record.key;
    const plaintext = typeof record.plaintext === "string" ? record.plaintext.trim() : "";
    if (!plaintext.startsWith("capy_")) {
      throw new CapyError("upstream_error", "Capy \u6CA1\u6709\u8FD4\u56DE API Key \u660E\u6587");
    }
    return {
      plaintext,
      ...key && typeof key === "object" && !Array.isArray(key) && typeof key.id === "string" ? { keyId: String(key.id) } : {}
    };
  }
  async listDevices(jwt, orgId, signal) {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/devices`, {
      method: "GET",
      ...signal ? { signal } : {}
    });
    return itemsOf(body).flatMap((item) => {
      if (!item || typeof item !== "object")
        return [];
      const record = item;
      const id = typeof record.id === "string" ? record.id : "";
      if (!id)
        return [];
      return [{
        id,
        name: typeof record.name === "string" ? record.name : "",
        connected: record.connected === true
      }];
    });
  }
  async renameDevice(jwt, orgId, deviceId, name, signal) {
    await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/devices/${encodeURIComponent(deviceId)}`, { method: "PATCH", body: JSON.stringify({ name }), ...signal ? { signal } : {} });
  }
  async startDeviceCode(jwt, input, signal) {
    const body = await this.json(jwt, "/devices/code", {
      method: "POST",
      body: JSON.stringify({
        hostname: input.hostname,
        os: input.os,
        arch: input.arch
      }),
      ...signal ? { signal } : {}
    });
    const record = body;
    const userCode = String(record.userCode ?? "").trim();
    const deviceCode = String(record.deviceCode ?? "").trim();
    if (!userCode || !deviceCode) {
      throw new CapyError("upstream_error", "Capy \u8BBE\u5907\u7801\u63A5\u53E3\u6CA1\u6709\u8FD4\u56DE userCode/deviceCode");
    }
    return {
      userCode,
      deviceCode,
      verificationUrl: typeof record.verificationUrl === "string" ? record.verificationUrl : "",
      expiresInSeconds: Number(record.expiresInSeconds) || 300,
      pollIntervalSeconds: Math.max(1, Number(record.pollIntervalSeconds) || 5)
    };
  }
  async approveDeviceCode(jwt, orgId, userCode, name, signal) {
    await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/devices/code/approve`, {
      method: "POST",
      body: JSON.stringify({ userCode, name }),
      ...signal ? { signal } : {}
    });
  }
  async pollDeviceCode(jwt, deviceCode, signal) {
    const body = await this.json(jwt, "/devices/code/poll", {
      method: "POST",
      body: JSON.stringify({ deviceCode }),
      ...signal ? { signal } : {}
    });
    const record = body;
    const status = String(record.status ?? "");
    if (status === "pending" || status === "slow_down")
      return { status };
    if (status === "denied" || status === "expired")
      return { status };
    if (status === "approved") {
      const enrolled = record.enrolled;
      if (!enrolled || typeof enrolled !== "object" || Array.isArray(enrolled)) {
        throw new CapyError("upstream_error", "Capy \u8BBE\u5907\u7801\u6279\u51C6\u4E86\uFF0C\u4F46\u6CA1\u6709 enrolled");
      }
      const e = enrolled;
      const device = e.device;
      const deviceId = device && typeof device === "object" && !Array.isArray(device) ? String(device.id ?? "") : "";
      const token = String(e.token ?? "").trim();
      if (!deviceId || !token.startsWith("capyd_")) {
        throw new CapyError("upstream_error", "Capy \u8BBE\u5907\u7801\u6279\u51C6\u4E86\uFF0C\u4F46\u6CA1\u6709 deviceId/token");
      }
      return {
        status,
        enrolled: {
          orgId: String(e.orgId ?? ""),
          deviceId,
          name: device && typeof device === "object" && !Array.isArray(device) ? String(device.name ?? "") : "",
          token
        }
      };
    }
    return { status: "pending" };
  }
  async createJam(jwt, orgId, input, signal) {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams`, {
      method: "POST",
      body: JSON.stringify({
        jamId: input.jamId,
        requestId: input.requestId,
        clientKey: input.clientKey,
        message: input.message,
        model: {
          modelId: input.modelId,
          ...input.reasoningMode ? { reasoningMode: input.reasoningMode } : {}
        },
        device: {
          deviceId: input.deviceId,
          workspace: { kind: "worktree" }
        },
        ...input.files && input.files.length > 0 ? { files: input.files } : {},
        ...input.promptVariant ? { promptVariant: input.promptVariant } : {}
      }),
      ...signal ? { signal } : {}
    }, input.ads ? { "x-capy-client-features": "message-edit,visual,ads-models" } : {});
    const record = body;
    const id = String(record.id ?? "").trim();
    if (!id)
      throw new CapyError("upstream_error", "Capy \u521B\u5EFA\u7EBF\u7A0B\u6CA1\u6709\u8FD4\u56DE id");
    const machine = record.primaryMachine;
    const kind = machine && typeof machine === "object" && !Array.isArray(machine) ? String(machine.kind ?? "") : "";
    return {
      id,
      primaryMachine: { kind: kind === "cloud" ? "cloud" : "device" }
    };
  }
  async getJam(jwt, orgId, jamId, signal) {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}`, {
      method: "GET",
      ...signal ? { signal } : {}
    });
    const record = body;
    return {
      id: String(record.id ?? jamId),
      status: String(record.status ?? ""),
      ...record.ask === null || record.ask && typeof record.ask === "object" ? { ask: record.ask } : {}
    };
  }
  async getJamEvents(jwt, orgId, jamId, signal) {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}/events?limit=50`, { method: "GET", ...signal ? { signal } : {} });
    const record = body;
    const items = Array.isArray(record.items) ? record.items : [];
    return items.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        return [];
      const value = item;
      const id = typeof value.id === "string" ? value.id : "";
      const kind = typeof value.kind === "string" ? value.kind : "";
      if (!id || !kind)
        return [];
      const payload = value.payload && typeof value.payload === "object" && !Array.isArray(value.payload) ? value.payload : {};
      return [{
        id,
        kind,
        payload: {
          ...typeof payload.code === "string" ? { code: payload.code } : {},
          ...typeof payload.message === "string" ? { message: payload.message } : {}
        }
      }];
    });
  }
  async interruptJam(jwt, orgId, jamId, signal) {
    await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}/interrupt`, {
      method: "POST",
      body: "{}",
      ...signal ? { signal } : {}
    });
  }
  async json(jwt, route, init, extraHeaders = {}) {
    return await requestCapyJson(this.fetchImpl, `${CAPY_APP}${route}`, { ...init, headers: clientHeaders(jwt, extraHeaders) }, 30000);
  }
}

// src/adapters/capy/browser-login.ts
import { spawn } from "child_process";
import { createServer } from "net";
import fs2 from "fs";
import os2 from "os";
import path2 from "path";

// src/adapters/capy/local-login.ts
import fs from "fs";
import os from "os";
import path from "path";

// src/adapters/platform/dpapi.ts
import { execFileSync } from "child_process";
import crypto from "crypto";
var V10_PREFIX = "v10";
var NONCE_BYTES = 12;
var TAG_BYTES = 16;
var AES_KEY_BYTES = 32;
var DPAPI_TIMEOUT_MS = 15000;
function powershell(script) {
  return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], { encoding: "utf8", timeout: DPAPI_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 }).trim();
}
function dpapiTransform(encoded, op) {
  if (process.platform !== "win32")
    throw new Error("DPAPI \u53EA\u5728 Windows \u53EF\u7528");
  const script = `$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$b=[Convert]::FromBase64String('${encoded}')
$p=[System.Security.Cryptography.ProtectedData]::${op}($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($p)`;
  return powershell(script);
}
function dpapiUnprotect(blob) {
  return Buffer.from(dpapiTransform(Buffer.from(blob).toString("base64"), "Unprotect"), "base64");
}
function dpapiProtect(text) {
  return dpapiTransform(Buffer.from(text, "utf8").toString("base64"), "Protect");
}
function decryptChromiumAesGcm(ciphertextBase64, key) {
  const raw = Buffer.from(ciphertextBase64, "base64");
  if (raw.length < V10_PREFIX.length + NONCE_BYTES + TAG_BYTES) {
    throw new Error("ciphertext \u957F\u5EA6\u5F02\u5E38");
  }
  if (raw.subarray(0, V10_PREFIX.length).toString("latin1") !== V10_PREFIX) {
    throw new Error("ciphertext \u4E0D\u662F v10 \u683C\u5F0F");
  }
  const nonce = raw.subarray(V10_PREFIX.length, V10_PREFIX.length + NONCE_BYTES);
  const body = raw.subarray(V10_PREFIX.length + NONCE_BYTES, raw.length - TAG_BYTES);
  const tag = raw.subarray(raw.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8").trim();
}
function coerceAesKey(value) {
  let key = null;
  if (ArrayBuffer.isView(value))
    key = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  else if (value instanceof ArrayBuffer)
    key = Buffer.from(value);
  else if (typeof value === "string" && /^[0-9a-fA-F]{64}$/u.test(value.trim())) {
    key = Buffer.from(value.trim(), "hex");
  }
  if (!key || key.length !== AES_KEY_BYTES)
    throw new Error("AES key \u5FC5\u987B\u662F 32 \u5B57\u8282");
  return key;
}

// src/adapters/capy/local-login.ts
var DPAPI_PREFIX = "DPAPI";
function capyDir() {
  const appData = String(process.env.APPDATA ?? "").trim();
  return path.join(appData || path.join(os.homedir(), "AppData", "Roaming"), "Capy");
}
function readJson(file, label) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new CapyError("sign_in_required", `\u672A\u627E\u5230 Capy \u7684 ${label}\uFF0C\u8BF7\u5148\u5728 Capy \u684C\u9762\u7AEF\u767B\u5F55`);
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("not object");
    return value;
  } catch {
    throw new CapyError("invalid_request", `Capy \u7684 ${label} \u4E0D\u662F\u6709\u6548 JSON`);
  }
}
function stringOf(value) {
  return typeof value === "string" ? value.trim() : "";
}
function jwtPayload(token) {
  const value = decodeJwtPayload(token);
  if (!value)
    throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u51ED\u636E\u7684 JWT payload \u65E0\u6CD5\u89E3\u6790");
  return value;
}
function readCapyInstall(dir = capyDir()) {
  if (process.platform !== "win32") {
    throw new CapyError("invalid_request", "\u672C\u673A\u5BFC\u5165\u53EA\u652F\u6301 Windows\uFF08Capy \u672C\u5730\u51ED\u636E\u7528 DPAPI \u52A0\u5BC6\uFF09\uFF1B\u8BF7\u7528\u6D4F\u89C8\u5668\u767B\u5F55");
  }
  const session = readJson(path.join(dir, "session-credential.json"), "session-credential.json");
  const device = readJson(path.join(dir, "device-credentials.json"), "device-credentials.json");
  const localState = readJson(path.join(dir, "Local State"), "Local State");
  const sessionId = stringOf(session.sessionId);
  const userId = stringOf(session.userId);
  const ciphertext = stringOf(session.ciphertext);
  if (!sessionId || !userId || !ciphertext) {
    throw new CapyError("invalid_request", "Capy \u7684 session-credential.json \u7F3A\u5C11\u5B57\u6BB5");
  }
  const orgs = device.orgs;
  if (!orgs || typeof orgs !== "object" || Array.isArray(orgs)) {
    throw new CapyError("invalid_request", "Capy \u7684 device-credentials.json \u7F3A\u5C11 orgs");
  }
  const orgId = Object.keys(orgs)[0] ?? "";
  const entry = orgId ? orgs[orgId] : null;
  const deviceId = entry && typeof entry === "object" && !Array.isArray(entry) ? stringOf(entry.deviceId) : "";
  if (!orgId || !deviceId) {
    throw new CapyError("sign_in_required", "Capy \u684C\u9762\u7AEF\u8FD8\u6CA1\u6709\u5DF2\u767B\u5F55\u7684\u7EC4\u7EC7/\u8BBE\u5907");
  }
  const osCrypt = localState.os_crypt;
  const encryptedKey = osCrypt && typeof osCrypt === "object" && !Array.isArray(osCrypt) ? stringOf(osCrypt.encrypted_key) : "";
  if (!encryptedKey) {
    throw new CapyError("invalid_request", "Capy \u7684 Local State \u7F3A\u5C11 os_crypt.encrypted_key");
  }
  const raw = Buffer.from(encryptedKey, "base64");
  if (raw.subarray(0, DPAPI_PREFIX.length).toString("latin1") !== DPAPI_PREFIX) {
    throw new CapyError("invalid_request", "Capy \u7684\u672C\u5730\u5BC6\u94A5\u4E0D\u662F DPAPI \u683C\u5F0F");
  }
  let clientJwt = "";
  try {
    const key = coerceAesKey(dpapiUnprotect(raw.subarray(DPAPI_PREFIX.length)));
    clientJwt = decryptChromiumAesGcm(ciphertext, key);
  } catch (error) {
    throw new CapyError("sign_in_required", "\u65E0\u6CD5\u89E3\u5BC6 Capy \u672C\u5730\u767B\u5F55\u6001\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D Windows \u7528\u6237\u5C31\u662F\u767B\u5F55 Capy \u7684\u7528\u6237\uFF0C\u6216\u91CD\u65B0\u767B\u5F55", { cause: error });
  }
  const claims = jwtPayload(clientJwt);
  const clientId = stringOf(claims.id);
  if (!clientId)
    throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u51ED\u636E\u7F3A\u5C11 Clerk client id");
  return {
    clientJwt,
    sessionId,
    userId,
    clientId,
    orgId,
    deviceId,
    source: "local"
  };
}

// src/adapters/capy/browser-login.ts
var LOGIN_URL = "https://capy.ai/sign-in";
var POLL_MS = 500;
var DEFAULT_TIMEOUT_MS = 5 * 60000;
var WIN_BROWSERS = [
  ["Google", "Chrome", "Application", "chrome.exe"],
  ["Microsoft", "Edge", "Application", "msedge.exe"],
  ["Chromium", "Application", "chrome.exe"],
  ["BraveSoftware", "Brave-Browser", "Application", "brave.exe"]
];
function exists(file) {
  try {
    return fs2.statSync(file).isFile();
  } catch {
    return false;
  }
}
function findBrowser() {
  const explicit = String(process.env.MAGPIE_CAPY_BROWSER ?? "").trim().replace(/^"|"$/gu, "");
  if (explicit && exists(explicit))
    return explicit;
  const candidates = [];
  if (process.platform === "win32") {
    const roots = [
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
      process.env.LOCALAPPDATA
    ].filter((value) => Boolean(value));
    for (const root of roots) {
      for (const parts of WIN_BROWSERS)
        candidates.push(path2.join(root, ...parts));
    }
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser");
  } else {
    const pathDirs = String(process.env.PATH ?? "").split(":");
    for (const name of ["google-chrome", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"]) {
      for (const dir of pathDirs) {
        const file = path2.join(dir, name);
        if (exists(file))
          candidates.push(file);
      }
    }
  }
  return candidates.find(exists) ?? "";
}

class CdpConnection {
  ws;
  nextId = 1;
  pending = new Map;
  constructor(ws) {
    this.ws = ws;
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", () => {
      for (const item of this.pending.values()) {
        clearTimeout(item.timer);
        item.reject(new Error("CDP \u8FDE\u63A5\u5DF2\u5173\u95ED"));
      }
      this.pending.clear();
    });
  }
  send(method, params = {}, timeoutMs = 1e4) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} \u8D85\u65F6`));
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  close() {
    try {
      this.ws.close();
    } catch {}
  }
  onMessage(event) {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (typeof message.id !== "number")
      return;
    const item = this.pending.get(message.id);
    if (!item)
      return;
    clearTimeout(item.timer);
    this.pending.delete(message.id);
    if (message.error)
      item.reject(new Error(message.error.message || "CDP error"));
    else
      item.resolve(message.result);
  }
}
async function cdpJson(port, route, signal) {
  const timeout = AbortSignal.timeout(2000);
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout
  });
  if (!response.ok)
    return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}
async function waitPort(port, signal, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    const info = await cdpJson(port, "/json/version").catch(() => null);
    if (info && typeof info === "object")
      return true;
    await sleep(150, signal);
  }
  return false;
}
async function connectPage(port, signal, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    const list = await cdpJson(port, "/json/list").catch(() => null);
    if (Array.isArray(list)) {
      const page = list.find((item) => {
        if (!item || typeof item !== "object")
          return false;
        const record = item;
        return record.type === "page" && typeof record.webSocketDebuggerUrl === "string";
      });
      if (page && typeof page.webSocketDebuggerUrl === "string") {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await waitOpen(ws, signal);
        return new CdpConnection(ws);
      }
    }
    await sleep(200, signal);
  }
  throw new CapyError("upstream_unavailable", "\u8FDE\u4E0D\u4E0A\u6D4F\u89C8\u5668\u8C03\u8BD5\u7AEF\u53E3\uFF0C\u8BF7\u786E\u8BA4\u6D4F\u89C8\u5668\u6CA1\u6709\u7981\u7528\u8C03\u8BD5");
}
function waitOpen(ws, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {}
      reject(new Error("\u6D4F\u89C8\u5668 CDP WebSocket \u8FDE\u63A5\u8D85\u65F6"));
    }, 1e4);
    timer.unref?.();
    const onAbort = () => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      reject(abortError());
    };
    if (signal.aborted)
      return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      try {
        ws.close();
      } catch {}
      reject(new CapyError("upstream_unavailable", "\u6D4F\u89C8\u5668 CDP WebSocket \u8FDE\u63A5\u5931\u8D25"));
    }, { once: true });
  });
}
async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  const record = result;
  return record?.result?.value ?? null;
}
var CLERK_STATE = `(() => {
  try {
    const clerk = window.Clerk;
    if (!clerk || !clerk.session || !clerk.user) return null;
    const sessionId = typeof clerk.session.id === "string" ? clerk.session.id : "";
    const userId = typeof clerk.user.id === "string" ? clerk.user.id : "";
    if (!sessionId || !userId) return null;
    return JSON.stringify({ sessionId, userId });
  } catch { return null; }
})()`;
var SELECTED_ORG = `(() => {
  try {
    return localStorage.getItem("capy-web:selected-org")
      || localStorage.getItem("capy-web:last-selected-org")
      || "";
  } catch { return ""; }
})()`;
async function readCookie(cdp) {
  for (const method of ["Network.getAllCookies", "Storage.getCookies"]) {
    let result;
    try {
      result = await cdp.send(method);
    } catch {
      continue;
    }
    const record = result;
    const cookies = Array.isArray(record?.cookies) ? record.cookies : [];
    for (const cookie of cookies) {
      if (!cookie || typeof cookie !== "object")
        continue;
      const value = cookie;
      if (value.name === "__client" && typeof value.value === "string")
        return value.value;
    }
  }
  return "";
}
function clientIdOf(clientJwt) {
  const payload = decodeJwtPayload(clientJwt);
  return typeof payload?.id === "string" ? payload.id : "";
}
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => port ? resolve(port) : reject(new Error("no free port")));
    });
  });
}
function launchArgs(port, profile) {
  return [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    LOGIN_URL
  ];
}
function browserExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}
async function waitDevToolsFile(profile, signal, timeoutMs) {
  const file = path2.join(profile, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    if (fs2.existsSync(file)) {
      const port = Number(fs2.readFileSync(file, "utf8").split(/\r?\n/u)[0]?.trim() ?? 0);
      if (Number.isInteger(port) && port > 0)
        return port;
    }
    await sleep(150, signal);
  }
  return 0;
}
async function chromiumLogin(options = {}) {
  const exe = options.browser || findBrowser();
  if (!exe) {
    throw new CapyError("invalid_request", "\u6CA1\u6709\u627E\u5230 Chromium \u6D4F\u89C8\u5668\uFF08Chrome / Edge / Chromium / Brave\uFF09\u3002\u8BF7\u5B89\u88C5\uFF0C\u6216\u8BBE\u7F6E MAGPIE_CAPY_BROWSER");
  }
  const signal = options.signal ?? new AbortController().signal;
  const timeoutMs = Math.max(1e4, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const profile = fs2.mkdtempSync(path2.join(os2.tmpdir(), "magpie-capy-"));
  let child = null;
  try {
    let port = 0;
    for (let attempt = 0;attempt < 3 && !port; attempt += 1) {
      const tryPort = attempt === 0 ? 0 : await freePort();
      child = spawn(exe, launchArgs(tryPort, profile), { stdio: "ignore", windowsHide: false });
      if (tryPort === 0) {
        port = await waitDevToolsFile(profile, signal, 15000);
        if (!port) {
          try {
            child.kill("SIGTERM");
          } catch {}
          child = null;
        }
      } else if (await waitPort(tryPort, signal, 15000)) {
        port = tryPort;
      } else {
        try {
          child.kill("SIGTERM");
        } catch {}
        child = null;
      }
    }
    if (!port)
      throw new CapyError("upstream_unavailable", "\u6D4F\u89C8\u5668\u6CA1\u6709\u6253\u5F00\u8C03\u8BD5\u7AEF\u53E3");
    const deadline = Date.now() + timeoutMs;
    let sawClerk = false;
    let cdp = null;
    try {
      while (Date.now() < deadline) {
        throwIfAborted(signal);
        if (child && browserExited(child)) {
          throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u6D4F\u89C8\u5668\u5DF2\u5173\u95ED\uFF0C\u8BF7\u91CD\u65B0\u53D1\u8D77\u767B\u5F55");
        }
        try {
          cdp ??= await connectPage(port, signal, 5000);
          const stateRaw = await evaluate(cdp, CLERK_STATE);
          if (stateRaw) {
            sawClerk = true;
            let state = null;
            try {
              state = JSON.parse(stateRaw);
            } catch {}
            const clientJwt = await readCookie(cdp);
            if (clientJwt && state?.sessionId && state.userId) {
              const orgId = await evaluate(cdp, SELECTED_ORG).catch(() => "");
              return {
                clientJwt,
                sessionId: state.sessionId,
                userId: state.userId,
                clientId: clientIdOf(clientJwt),
                ...orgId ? { orgId: String(orgId) } : {},
                source: "browser"
              };
            }
          }
        } catch (error) {
          cdp?.close();
          cdp = null;
          if (signal.aborted)
            throw abortError();
          if (error instanceof CapyError && error.kind === "sign_in_required")
            throw error;
        }
        await sleep(POLL_MS, signal);
      }
    } finally {
      cdp?.close();
    }
    if (sawClerk) {
      throw new CapyError("sign_in_required", "\u5DF2\u5728 Capy \u767B\u5F55\uFF0C\u4F46\u8BFB\u4E0D\u5230 __client Cookie\u3002\u8BF7\u8BA9\u6D4F\u89C8\u5668\u505C\u7559\u5728 capy.ai \u9875\u9762\u540E\u91CD\u8BD5");
    }
    throw new CapyError("upstream_timeout", "\u7B49\u5F85 Capy \u6D4F\u89C8\u5668\u767B\u5F55\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5");
  } finally {
    if (child)
      killTree(child);
    setTimeout(() => {
      try {
        fs2.rmSync(profile, { recursive: true, force: true });
      } catch {}
    }, 1000).unref?.();
  }
}
function killTree(child) {
  try {
    child.kill("SIGTERM");
  } catch {}
  if (process.platform === "win32" && child.pid) {
    try {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore"
      });
      killer.unref();
    } catch {}
  }
}

class CapyLoginSources {
  async local() {
    return readCapyInstall();
  }
  async browser(signal) {
    return chromiumLogin({ ...signal ? { signal } : {} });
  }
}
function abortError() {
  return new DOMException("Aborted", "AbortError");
}
function throwIfAborted(signal) {
  if (signal.aborted)
    throw abortError();
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted)
      return reject(abortError());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// src/adapters/capy/device-tunnel.ts
import { spawn as spawn2 } from "child_process";
import { createHash } from "crypto";
import { StringDecoder } from "string_decoder";
import fs3 from "fs";
import os3 from "os";
import path3 from "path";

// src/domain/account.ts
var SESSION_TTL_MS = 7 * 24 * 3600000;
function accountKey(session) {
  return `${session.uid || session.accountId}@${session.orgId}`;
}

// src/adapters/capy/device-tunnel.ts
var HEADLESS_NAME = "magpie-headless";
var READY_TIMEOUT_MS = 15000;
var CONNECT_POLL_MS = 400;
var STATE_VERSION = 1;
function deviceOs() {
  if (process.platform === "win32")
    return "win32";
  if (process.platform === "darwin")
    return "darwin";
  return "linux";
}
function deviceArch() {
  return process.arch === "arm64" ? "arm64" : "x86_64";
}
function defaultDeviceName() {
  const override = String(process.env.MAGPIE_CAPY_DEVICE_NAME ?? "").trim();
  if (override)
    return override.slice(0, 80);
  let host = "";
  try {
    host = os3.hostname();
  } catch {}
  let user = "";
  try {
    user = os3.userInfo().username;
  } catch {}
  if (!user)
    user = String(process.env.USERNAME ?? process.env.USER ?? "").trim();
  const raw = host || user || "capy-headless";
  return raw.replace(/[^A-Za-z0-9._@-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 80) || "capy-headless";
}
function stateDir() {
  const override = String(process.env.MAGPIE_CAPY_STATE_DIR ?? "").trim();
  if (override)
    return path3.resolve(override);
  if (process.platform === "win32") {
    return path3.join(process.env.LOCALAPPDATA || path3.join(os3.homedir(), "AppData", "Local"), "magpie-capy");
  }
  if (process.platform === "darwin") {
    return path3.join(os3.homedir(), "Library", "Application Support", "magpie-capy");
  }
  return path3.join(process.env.XDG_STATE_HOME || path3.join(os3.homedir(), ".local", "state"), "magpie-capy");
}

class FileSecretStore {
  baseDir;
  constructor(baseDir = stateDir()) {
    this.baseDir = baseDir;
  }
  async load(account) {
    try {
      const doc = JSON.parse(fs3.readFileSync(this.fileOf(account), "utf8"));
      if (doc.version !== STATE_VERSION)
        return null;
      const orgId = String(doc.orgId ?? "");
      const deviceId = String(doc.deviceId ?? "");
      const name = String(doc.name ?? HEADLESS_NAME);
      const token = typeof doc.token === "string" ? doc.token : typeof doc.tokenCiphertext === "string" ? dpapiUnprotect(Buffer.from(doc.tokenCiphertext, "base64")).toString("utf8") : "";
      if (!orgId || !deviceId || !token.startsWith("capyd_"))
        return null;
      return { orgId, deviceId, name, token };
    } catch {
      return null;
    }
  }
  async save(account, credential) {
    fs3.mkdirSync(this.baseDir, { recursive: true });
    const file = this.fileOf(account);
    const tmp = `${file}.${process.pid}.tmp`;
    const secret = process.platform === "win32" ? { tokenCiphertext: dpapiProtect(credential.token) } : { token: credential.token };
    fs3.writeFileSync(tmp, JSON.stringify({
      version: STATE_VERSION,
      orgId: credential.orgId,
      deviceId: credential.deviceId,
      name: credential.name,
      ...secret
    }, null, 2), { mode: 384 });
    fs3.renameSync(tmp, file);
    if (process.platform !== "win32") {
      try {
        fs3.chmodSync(file, 384);
      } catch {}
    }
  }
  async clear(account) {
    try {
      fs3.unlinkSync(this.fileOf(account));
    } catch {}
  }
  fileOf(account) {
    const safe = account.replace(/[^A-Za-z0-9._-]+/gu, "_").slice(0, 120);
    return path3.join(this.baseDir, `headless-${safe}.json`);
  }
}
var STREAM_TIMEOUT_MS = 60000;
function encodeDataFrame(streamId, body) {
  const frame = Buffer.alloc(4 + body.length);
  frame.writeUInt32BE(streamId >>> 0, 0);
  body.copy(frame, 4);
  return frame;
}
function decodeDataFrame(bytes) {
  if (bytes.length < 4)
    return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { streamId: view.getUint32(0), body: bytes.subarray(4) };
}
function ok(result) {
  return { status: "succeeded", result };
}
function fail(code, message) {
  return { status: "failed", error: { code, message } };
}
function fileFailure(error) {
  const code = error?.code;
  const message = error instanceof Error ? error.message : String(error);
  if (code === "ENOENT")
    return fail("MachineServer.FileError", `not-found: ${message}`);
  if (code === "EISDIR")
    return fail("MachineServer.FileError", `is-directory: ${message}`);
  if (code === "EACCES" || code === "EPERM")
    return fail("MachineServer.FileError", `permission-denied: ${message}`);
  return fail("MachineServer.FileError", `other: ${message}`);
}
function resolveIn(cwd, raw) {
  const value = String(raw ?? "").trim();
  if (!value)
    throw new Error("path is required");
  return path3.isAbsolute(value) ? path3.normalize(value) : path3.resolve(cwd, value);
}
function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}
async function runBash(params, cwd) {
  const command = String(params.command ?? "");
  if (!command.trim())
    return fail("MachineServer.Bash", "bash command is empty");
  const timeoutSeconds = Math.max(1, Math.min(600, Number(params.timeoutSeconds) || 120));
  const runCwd = path3.resolve(cwd);
  try {
    fs3.mkdirSync(runCwd, { recursive: true });
  } catch {}
  const shell = String(process.env.MAGPIE_CAPY_BASH ?? "").trim() || "bash";
  const env = {
    ...process.env,
    PS1: "",
    NO_COLOR: "1",
    TERM: "dumb",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    PAGER: "cat",
    GIT_PAGER: "cat",
    GH_PAGER: "cat",
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "0"
  };
  const startedAt = Date.now();
  const maxChars = 4 * 1024 * 1024;
  return await new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let child;
    try {
      child = spawn2(shell, ["-lc", command], { cwd: runCwd, env, windowsHide: true });
    } catch (error) {
      resolve(fail("MachineServer.Bash", `Failed to start bash: ${error instanceof Error ? error.message : String(error)}`));
      return;
    }
    const stdoutDecoder = new StringDecoder("utf8");
    const stderrDecoder = new StringDecoder("utf8");
    const append = (current, text) => {
      if (current.length >= maxChars)
        return current;
      return current + text.slice(0, maxChars - current.length);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {}
      if (process.platform === "win32" && child.pid) {
        try {
          spawn2("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }).unref();
        } catch {}
      }
    }, timeoutSeconds * 1000);
    timer.unref?.();
    child.stdout?.on("data", (chunk) => {
      stdout = append(stdout, stdoutDecoder.write(chunk));
    });
    child.stderr?.on("data", (chunk) => {
      stderr = append(stderr, stderrDecoder.write(chunk));
    });
    child.on("error", (error) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      resolve(fail("MachineServer.Bash", `Failed to start bash: ${error.message}`));
    });
    child.on("close", (code) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      stdout = append(stdout, stdoutDecoder.end());
      stderr = append(stderr, stderrDecoder.end());
      resolve(ok({
        kind: "bash",
        stdout,
        stderr,
        exitCode: typeof code === "number" ? code : -1,
        durationMs: Date.now() - startedAt,
        timedOut,
        isError: timedOut,
        ...timedOut ? { landingNote: "Command timed out and was stopped." } : {}
      }));
    });
  });
}
async function machineResult(handler, params, worktreeBase) {
  if (handler === "worktree_ensure") {
    const root = String(params.root ?? "");
    let created = false;
    if (root) {
      const base = path3.resolve(worktreeBase);
      const resolved = path3.resolve(root);
      if (resolved !== base && !resolved.startsWith(`${base}${path3.sep}`)) {
        return fail("MachineServer.Refused", "worktree root outside worktreeBase");
      }
      created = !fs3.existsSync(resolved);
      fs3.mkdirSync(resolved, { recursive: true });
    }
    return ok({ root: root ? path3.resolve(root) : "", created, checkouts: [] });
  }
  if (handler === "worktree_list") {
    return ok({ kind: "worktree_list", entries: [] });
  }
  if (handler === "volume_landed") {
    const mounts = Array.isArray(params.mounts) ? params.mounts : [];
    return ok({
      kind: "volume_landed",
      mounts: mounts.map((mount) => ({
        mountPath: String(mount?.mountPath ?? ""),
        current: true
      })),
      landing: false,
      checkpoints: false,
      directories: [],
      unretained: [],
      handback: true
    });
  }
  if (handler === "volume_probe") {
    const mounts = Array.isArray(params.mounts) ? params.mounts : [];
    return ok({
      mounts: mounts.map((mount) => ({
        mountPath: String(mount?.mountPath ?? ""),
        state: "current"
      }))
    });
  }
  if (handler === "bash")
    return await runBash(params, worktreeBase);
  if (handler === "bash_output")
    return ok({ kind: "not-running" });
  if (handler === "read") {
    try {
      const file = resolveIn(worktreeBase, params.path);
      const text = fs3.readFileSync(file, "utf8");
      const offset = Math.max(1, Number(params.offset) || 1);
      const limit = Math.max(1, Math.min(1e4, Number(params.limit) || 2000));
      const maxChars = Math.max(200, Math.min(1e5, Number(params.maxChars) || 20000));
      const all = text.split(/\r?\n/u);
      const content = all.slice(offset - 1, offset - 1 + limit).map((line) => line.length > maxChars ? `${line.slice(0, maxChars)}... (line truncated to ${maxChars} chars)` : line).join(`
`);
      return ok({ kind: "read", content, offset, totalLines: all.length, isError: false });
    } catch (error) {
      return fileFailure(error);
    }
  }
  if (handler === "write") {
    try {
      const file = resolveIn(worktreeBase, params.path);
      const content = String(params.content ?? "");
      fs3.mkdirSync(path3.dirname(file), { recursive: true });
      fs3.writeFileSync(file, content, "utf8");
      return ok({ kind: "write", path: file, bytes: Buffer.byteLength(content), isError: false });
    } catch (error) {
      return fileFailure(error);
    }
  }
  if (handler === "edit") {
    try {
      const file = resolveIn(worktreeBase, params.path);
      const oldString = String(params.oldString ?? "");
      const newString = String(params.newString ?? "");
      if (!oldString || oldString === newString) {
        return fail("MachineServer.FileError", "oldString must be non-empty and differ from newString");
      }
      const text = fs3.readFileSync(file, "utf8");
      const parts = text.split(oldString);
      const count = parts.length - 1;
      if (count === 0)
        return fail("MachineServer.FileError", `The text was not found in ${String(params.path)}`);
      if (count > 1 && params.replaceAll !== true) {
        return fail("MachineServer.FileError", `Found ${count} occurrences; provide more context or replaceAll`);
      }
      const next = params.replaceAll === true ? parts.join(newString) : `${parts[0] ?? ""}${newString}${parts.slice(1).join(oldString)}`;
      fs3.writeFileSync(file, next, "utf8");
      return ok({ kind: "edit", path: file, replacements: count, isError: false });
    } catch (error) {
      return fileFailure(error);
    }
  }
  if (handler === "file_read") {
    try {
      const file = resolveIn(worktreeBase, params.path);
      const text = fs3.readFileSync(file, "utf8");
      return ok({ kind: "read", path: file, content: { text }, sha: sha256(text), isError: false });
    } catch (error) {
      if (error?.code === "ENOENT")
        return ok({ kind: "missing", isError: false });
      return fileFailure(error);
    }
  }
  if (handler === "file_write") {
    try {
      const file = resolveIn(worktreeBase, params.path);
      const content = String(params.content ?? "");
      let currentSha = null;
      try {
        currentSha = sha256(fs3.readFileSync(file, "utf8"));
      } catch {}
      const baseSha = typeof params.baseSha === "string" ? params.baseSha : null;
      if (baseSha !== null && currentSha !== baseSha) {
        return ok({ kind: "conflict", currentSha, isError: false });
      }
      fs3.mkdirSync(path3.dirname(file), { recursive: true });
      fs3.writeFileSync(file, content, "utf8");
      return ok({ kind: "written", sha: sha256(content), bytes: Buffer.byteLength(content), isError: false });
    } catch (error) {
      return fileFailure(error);
    }
  }
  return fail("MachineServer.Unavailable", `\u65E0\u5934\u8BBE\u5907\u672A\u5B9E\u73B0 ${handler || "unknown"}\uFF1B\u6D4F\u89C8\u5668/computer \u7B49\u5DE5\u5177\u4E0D\u4F1A\u6267\u884C\u3002`);
}

class HeadlessDevice {
  credential;
  WebSocketImpl;
  worktreeBase;
  ws = null;
  ready = false;
  connectPromise = null;
  readyResolve = null;
  readyReject = null;
  streams = new Map;
  activeRoot = null;
  constructor(options) {
    this.credential = options.credential;
    const Impl = options.WebSocketImpl ?? globalThis.WebSocket;
    if (typeof Impl !== "function") {
      throw new CapyError("upstream_unavailable", "\u5F53\u524D\u8FD0\u884C\u65F6\u6CA1\u6709 WebSocket\uFF08\u9700\u8981 Bun / Node 22+\uFF09");
    }
    this.WebSocketImpl = Impl;
    this.worktreeBase = options.worktreeBase ?? path3.join(os3.homedir(), ".capy", "worktrees");
  }
  get info() {
    return {
      id: this.credential.deviceId,
      name: this.credential.name,
      connected: this.ready
    };
  }
  async ensure(timeoutMs = READY_TIMEOUT_MS) {
    if (this.ready && this.ws?.readyState === 1)
      return;
    if (this.connectPromise)
      return await this.connectPromise;
    this.connectPromise = this.connect(timeoutMs);
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }
  close() {
    this.ready = false;
    try {
      this.ws?.close(1000, "headless closed");
    } catch {}
    this.ws = null;
  }
  async connect(timeoutMs) {
    this.ready = false;
    let ws;
    try {
      ws = new this.WebSocketImpl(DEVICE_TUNNEL, {
        headers: { authorization: `Bearer ${this.credential.token}` }
      });
    } catch (error) {
      throw tunnelError(error, "\u8FDE\u63A5 Capy \u8BBE\u5907\u96A7\u9053\u5931\u8D25");
    }
    this.ws = ws;
    ws.binaryType = "arraybuffer";
    const ready = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    const timer = setTimeout(() => {
      const failure = new Error(`\u8FDE\u63A5 Capy \u8BBE\u5907\u96A7\u9053\u8D85\u65F6\uFF08${Math.round(timeoutMs / 1000)}s\uFF09`);
      failure.code = "device_connect_timeout";
      this.readyReject?.(failure);
      try {
        ws.close(4000, "ready timeout");
      } catch {}
    }, Math.max(3000, timeoutMs));
    timer.unref?.();
    ws.addEventListener("open", () => {
      this.send({
        type: "hello",
        contractVersion: CONTRACT_VERSION,
        deviceId: this.credential.deviceId,
        hostname: os3.hostname(),
        os: deviceOs(),
        workspaces: [],
        worktreeBase: this.worktreeBase,
        clientVersion: "magpie-headless 1.0"
      });
    });
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", (event) => {
      this.ready = false;
      this.ws = null;
      clearTimeout(timer);
      if (!this.readyResolve)
        return;
      const reason = String(event.reason || "");
      const rejected = [4001, 4003, 4401, 4403].includes(Number(event.code)) || /auth|token|unauthor|forbidden/iu.test(reason);
      const failure = new Error(`Capy \u8BBE\u5907\u96A7\u9053\u5DF2\u5173\u95ED\uFF08${event.code}${reason ? `\uFF1A${reason}` : ""}\uFF09`);
      failure.code = rejected ? "device_token_rejected" : "device_connect_failed";
      this.readyReject?.(failure);
    });
    ws.addEventListener("error", () => {
      const failure = new Error("Capy \u8BBE\u5907\u96A7\u9053\u8FDE\u63A5\u5931\u8D25");
      failure.code = "device_connect_failed";
      this.readyReject?.(failure);
    });
    try {
      await ready;
    } finally {
      clearTimeout(timer);
      this.readyResolve = null;
      this.readyReject = null;
    }
    this.ready = true;
  }
  send(frame) {
    if (!this.ws || this.ws.readyState !== 1)
      return;
    try {
      this.ws.send(JSON.stringify(frame));
    } catch {}
  }
  sendBinary(bytes) {
    if (!this.ws || this.ws.readyState !== 1)
      return;
    try {
      this.ws.send(bytes);
    } catch {}
  }
  onMessage(event) {
    if (typeof event.data === "string") {
      this.onControl(event.data);
      return;
    }
    const raw = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : ArrayBuffer.isView(event.data) ? new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength) : null;
    if (!raw)
      return;
    const frame = decodeDataFrame(raw);
    if (!frame)
      return;
    const stream = this.streams.get(frame.streamId);
    if (!stream || stream.done)
      return;
    const chunk = Buffer.from(frame.body);
    stream.chunks.push(chunk);
    stream.received += chunk.length;
    if (stream.expectedLength > 0 && stream.received >= stream.expectedLength)
      this.runStream(stream);
  }
  onControl(text) {
    let frame;
    try {
      frame = JSON.parse(text);
    } catch {
      return;
    }
    const type = String(frame.type ?? "");
    if (type === "ping") {
      this.send({ type: "pong" });
      return;
    }
    if (type === "session-config") {
      this.send({ type: "workspaces-changed", workspaces: [] });
      this.send({ type: "ready" });
      this.readyResolve?.();
      return;
    }
    if (type === "open") {
      const streamId = Number(frame.streamId);
      if (!Number.isInteger(streamId))
        return;
      const headers = {};
      if (frame.headers && typeof frame.headers === "object") {
        for (const [key, value] of Object.entries(frame.headers)) {
          headers[key.toLowerCase()] = String(value);
        }
      }
      const expectedLength = Number(headers["content-length"] ?? 0);
      const timer = setTimeout(() => {
        const stream = this.streams.get(streamId);
        if (!stream || stream.done)
          return;
        stream.done = true;
        this.streams.delete(streamId);
        this.respond(streamId, 200, fail("MachineServer.Timeout", "machine RPC stream timed out"));
      }, STREAM_TIMEOUT_MS);
      timer.unref?.();
      this.streams.set(streamId, {
        streamId,
        path: String(frame.path ?? ""),
        headers,
        expectedLength: Number.isFinite(expectedLength) && expectedLength > 0 ? expectedLength : 0,
        chunks: [],
        received: 0,
        timer,
        done: false
      });
      return;
    }
    if (type === "close") {
      const streamId = Number(frame.streamId);
      const stream = this.streams.get(streamId);
      if (stream)
        this.runStream(stream);
    }
  }
  runStream(stream) {
    if (stream.done)
      return;
    stream.done = true;
    if (stream.timer)
      clearTimeout(stream.timer);
    stream.timer = null;
    this.handleStream(stream).catch((error) => {
      this.respond(stream.streamId, 200, fail("MachineServer.Internal", errorText(error)));
    });
  }
  async handleStream(stream) {
    this.streams.delete(stream.streamId);
    let payload = null;
    try {
      const body = stream.chunks.length > 0 ? Buffer.concat(stream.chunks) : Buffer.alloc(0);
      payload = body.length > 0 ? JSON.parse(body.toString("utf8")) : null;
    } catch {}
    const record = payload && typeof payload === "object" ? payload : {};
    let result;
    if (stream.path.startsWith("/v1/git/capture")) {
      result = ok({ repos: [] });
    } else if (stream.path.startsWith("/v1/invocations")) {
      const handler = String(record.handler ?? "");
      const params = record.params && typeof record.params === "object" ? record.params : {};
      result = await machineResult(handler, params, this.activeRoot ?? this.worktreeBase);
      if (handler === "worktree_ensure" && result.status === "succeeded") {
        const root = result.result?.root;
        if (typeof root === "string" && root)
          this.activeRoot = root;
      }
    } else {
      result = fail("MachineServer.Unavailable", `\u672A\u5B9E\u73B0\u7684\u8DEF\u5F84 ${stream.path}`);
    }
    this.respond(stream.streamId, 200, result);
  }
  respond(streamId, status, payload) {
    const body = Buffer.from(JSON.stringify(payload));
    this.send({
      type: "response",
      streamId,
      status,
      headers: {
        "content-type": "application/json",
        "content-length": String(body.length)
      }
    });
    this.sendBinary(encodeDataFrame(streamId, body));
    this.send({ type: "close", streamId });
  }
}
function tunnelError(error, prefix) {
  const message = `${prefix}\uFF1A${error instanceof Error ? error.message : String(error)}`;
  const failure = new Error(message, { cause: error });
  failure.code = /40[13]|unauthor|forbidden/iu.test(message) ? "device_token_rejected" : "device_connect_failed";
  return failure;
}
function tokenRejected(error) {
  return error?.code === "device_token_rejected";
}

class HeadlessDeviceRuntime {
  app;
  store;
  clock;
  logger;
  deviceName;
  devices = new Map;
  constructor(options) {
    this.app = options.app;
    this.store = options.store;
    this.clock = options.clock;
    this.logger = options.logger;
    this.deviceName = options.deviceName?.trim() || defaultDeviceName();
  }
  async ensure(session, signal) {
    return await this.ensureOne(session, signal);
  }
  close() {
    for (const device of this.devices.values())
      device.close();
    this.devices.clear();
  }
  async ensureOne(session, signal) {
    const key = accountKey(session);
    const existing = this.devices.get(key);
    if (existing) {
      try {
        await existing.ensure();
        return existing.info;
      } catch {
        existing.close();
        this.devices.delete(key);
      }
    }
    const jwt = await this.app.sessionJwt(session.clerk, signal);
    let credential = await this.store.load(key);
    if (!credential || credential.orgId !== session.orgId) {
      credential = await this.pair(session, jwt, signal);
    } else if (credential.name !== this.deviceName) {
      try {
        await this.app.renameDevice(jwt, session.orgId, credential.deviceId, this.deviceName, signal);
        credential = { ...credential, name: this.deviceName };
        await this.store.save(key, credential);
      } catch (error) {
        this.logger?.warn("capy device rename failed", {
          deviceId: credential.deviceId,
          message: errorText(error)
        });
      }
    }
    let device;
    try {
      device = await this.connect(credential, signal);
    } catch (error) {
      if (!tokenRejected(error))
        throw error;
      credential = await this.pair(session, jwt, signal);
      device = await this.connect(credential, signal);
    }
    const connected = await this.waitConnected(jwt, session.orgId, credential.deviceId, signal);
    if (!connected) {
      device.close();
      throw new CapyError("upstream_unavailable", "\u65E0\u5934\u8BBE\u5907\u5DF2\u8FDE\u4E0A\u96A7\u9053\uFF0C\u4F46\u670D\u52A1\u7AEF\u6CA1\u6709\u6807\u8BB0 connected");
    }
    this.devices.set(key, device);
    return { id: credential.deviceId, name: credential.name, connected: true };
  }
  async connect(credential, signal) {
    let lastError = null;
    for (let attempt = 1;attempt <= 3; attempt += 1) {
      const device = new HeadlessDevice({ credential });
      try {
        await device.ensure();
        return device;
      } catch (error) {
        lastError = error;
        this.logger?.warn("capy device connect failed", {
          attempt,
          code: String(error?.code ?? ""),
          message: errorText(error)
        });
        device.close();
        if (tokenRejected(error) || attempt === 3)
          break;
        await this.clock.sleep(800 * attempt, signal);
      }
    }
    throw lastError instanceof Error ? lastError : new CapyError("upstream_unavailable", `\u65E0\u5934\u8BBE\u5907\u8FDE\u63A5\u5931\u8D25\uFF1A${String(lastError)}`);
  }
  async pair(session, jwt, signal) {
    const start = await this.app.startDeviceCode(jwt, {
      hostname: os3.hostname(),
      os: deviceOs(),
      arch: deviceArch()
    }, signal);
    try {
      await this.app.approveDeviceCode(jwt, session.orgId, start.userCode, this.deviceName, signal);
    } catch (error) {
      const hint = start.verificationUrl ? `\uFF1B\u53EF\u5728\u6D4F\u89C8\u5668\u6253\u5F00 ${start.verificationUrl} \u624B\u52A8\u6279\u51C6` : "";
      throw new CapyError("device_pair_failed", `Capy \u8BBE\u5907\u7801\u81EA\u52A8\u6279\u51C6\u5931\u8D25\uFF1A${errorText(error)}${hint}`);
    }
    let intervalMs = start.pollIntervalSeconds * 1000;
    const deadline = this.clock.now() + start.expiresInSeconds * 1000;
    while (this.clock.now() < deadline) {
      let poll;
      try {
        poll = await this.app.pollDeviceCode(jwt, start.deviceCode, signal);
      } catch (error) {
        if (error?.status === 401)
          throw error;
        await this.clock.sleep(intervalMs, signal);
        continue;
      }
      if (poll.status === "approved") {
        const credential = {
          orgId: poll.enrolled.orgId || session.orgId,
          deviceId: poll.enrolled.deviceId,
          name: this.deviceName,
          token: poll.enrolled.token
        };
        await this.store.save(accountKey(session), credential);
        return credential;
      }
      if (poll.status === "denied" || poll.status === "expired") {
        throw new CapyError("device_pair_failed", `Capy \u8BBE\u5907\u7801\u914D\u5BF9${poll.status === "denied" ? "\u88AB\u62D2\u7EDD" : "\u5DF2\u8FC7\u671F"}`);
      }
      if (poll.status === "slow_down")
        intervalMs = Math.min(1e4, Math.round(intervalMs * 1.5));
      await this.clock.sleep(intervalMs, signal);
    }
    throw new CapyError("upstream_timeout", "\u7B49\u5F85 Capy \u8BBE\u5907\u7801\u6279\u51C6\u8D85\u65F6");
  }
  async waitConnected(jwt, orgId, deviceId, signal) {
    const deadline = this.clock.now() + 20000;
    let attempt = 0;
    while (this.clock.now() < deadline) {
      try {
        const devices = await this.app.listDevices(jwt, orgId, signal);
        const hit = devices.find((device) => device.id === deviceId);
        if (hit?.connected)
          return true;
      } catch (error) {
        if (signal?.aborted || isAuthError(error))
          throw error;
      }
      attempt += 1;
      await this.clock.sleep(Math.min(3000, CONNECT_POLL_MS * 2 ** Math.min(attempt, 4)), signal);
    }
    return false;
  }
}

// src/protocol/sse.ts
class SseParser {
  buffer = "";
  feed(chunk) {
    this.buffer += chunk;
    const frames = [];
    for (;; ) {
      const match = /\r?\n\r?\n/u.exec(this.buffer);
      if (!match)
        break;
      const raw = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      const frame = parseFrame(raw);
      if (frame)
        frames.push(frame);
    }
    return frames;
  }
  end() {
    const raw = this.buffer;
    this.buffer = "";
    const frame = raw.trim() ? parseFrame(raw) : null;
    return frame ? [frame] : [];
  }
}
function parseFrame(raw) {
  let event = "";
  let data = "";
  let id = "";
  for (const line of raw.split(/\r?\n/u)) {
    if (!line || line.startsWith(":"))
      continue;
    const colon = line.indexOf(":");
    const field = colon >= 0 ? line.slice(0, colon) : line;
    const value = colon >= 0 ? line.slice(colon + 1).replace(/^ /u, "") : "";
    if (field === "event")
      event = value;
    else if (field === "data")
      data = data ? `${data}
${value}` : value;
    else if (field === "id")
      id = value;
  }
  if (!event && !data)
    return null;
  return { event, data, ...id ? { id } : {} };
}
async function* decodeSseStream(source) {
  const decoder = new TextDecoder;
  const parser = new SseParser;
  for await (const chunk of source) {
    for (const frame of parser.feed(decoder.decode(chunk, { stream: true }))) {
      yield frame;
    }
  }
  const tail = decoder.decode();
  for (const frame of parser.feed(tail))
    yield frame;
  for (const frame of parser.end())
    yield frame;
}

// src/adapters/capy/public-client.ts
function rawModels(items) {
  if (!Array.isArray(items))
    return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object")
      return [];
    const record = item;
    const id = typeof record.id === "string" ? record.id : "";
    if (!id)
      return [];
    const modes = Array.isArray(record.reasoningModes) ? record.reasoningModes.filter((mode) => typeof mode === "string") : undefined;
    return [{
      id,
      ...typeof record.name === "string" ? { name: record.name } : {},
      ...modes ? { reasoningModes: modes } : {}
    }];
  });
}

class CapyPublicClient {
  fetchImpl;
  constructor(fetchImpl = fetch) {
    this.fetchImpl = fetchImpl;
  }
  async listModels(apiKey, signal) {
    const body = await requestCapyJson(this.fetchImpl, `${CAPY_PUBLIC}/models`, { method: "GET", headers: publicHeaders(apiKey), ...signal ? { signal } : {} }, 20000);
    const record = body;
    return { items: rawModels(record.items) };
  }
  async* streamThread(apiKey, threadId, signal) {
    const url = `${CAPY_PUBLIC}/threads/${encodeURIComponent(threadId)}/stream?until=run`;
    let response;
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          ...publicHeaders(apiKey),
          accept: "text/event-stream"
        },
        ...signal ? { signal } : {}
      });
    } catch (error) {
      if (signal?.aborted)
        throw error;
      throw new CapyError("upstream_unavailable", `\u8FDE\u63A5 Capy \u6D41\u5931\u8D25\uFF1A${errorText(error)}`, { cause: error });
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let body2 = null;
      try {
        body2 = JSON.parse(text);
      } catch {}
      throw mapUpstream(response.status, body2, text.slice(0, 300));
    }
    if (!response.body)
      throw new CapyError("upstream_unavailable", "Capy \u6D41\u6CA1\u6709\u54CD\u5E94\u4F53");
    const body = response.body;
    async function* chunks() {
      const reader = body.getReader();
      try {
        for (;; ) {
          const { done, value } = await reader.read();
          if (done)
            return;
          if (value)
            yield value;
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
        ...frame.id ? { id: frame.id } : {}
      };
    }
  }
  async uploadFiles(apiKey, files, signal) {
    if (files.length === 0)
      return [];
    const body = await requestCapyJson(this.fetchImpl, `${CAPY_PUBLIC}/files`, {
      method: "POST",
      headers: publicHeaders(apiKey, { "content-type": "application/json" }),
      body: JSON.stringify({
        files: files.map((file) => ({
          name: file.name,
          mediaType: file.mediaType,
          sizeBytes: file.bytes.length
        }))
      }),
      ...signal ? { signal } : {}
    }, 30000);
    const targets = body?.targets;
    if (!Array.isArray(targets) || targets.length !== files.length) {
      throw new CapyError("upstream_error", "Capy \u6CA1\u6709\u8FD4\u56DE\u8DB3\u591F\u7684\u6587\u4EF6\u4E0A\u4F20\u76EE\u6807");
    }
    const out = [];
    for (let i = 0;i < files.length; i += 1) {
      const file = files[i];
      const target = targets[i];
      if (!file || !target || typeof target.fileId !== "string" || typeof target.url !== "string") {
        throw new CapyError("upstream_error", "Capy \u6587\u4EF6\u4E0A\u4F20\u76EE\u6807\u7F3A\u5C11 fileId/url");
      }
      const timeout = AbortSignal.timeout(60000);
      const putSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const put = await this.fetchImpl(target.url, {
        method: "PUT",
        headers: { "content-type": file.mediaType },
        body: file.bytes,
        signal: putSignal
      });
      if (!put.ok) {
        const detail = await put.text().catch(() => "");
        throw new CapyError("upstream_error", `\u9644\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF08HTTP ${put.status}\uFF09`, {
          detail: detail.slice(0, 200)
        });
      }
      out.push({
        fileId: target.fileId,
        name: file.name,
        mediaType: file.mediaType,
        sizeBytes: file.bytes.length
      });
    }
    return out;
  }
  async usage(apiKey, signal) {
    const body = await requestCapyJson(this.fetchImpl, `${CAPY_PUBLIC}/usage`, { method: "GET", headers: publicHeaders(apiKey), ...signal ? { signal } : {} }, 20000);
    return body ?? {};
  }
  async balance(apiKey, signal) {
    const body = await requestCapyJson(this.fetchImpl, `${CAPY_PUBLIC}/usage/balance`, { method: "GET", headers: publicHeaders(apiKey), ...signal ? { signal } : {} }, 20000);
    return body ?? {};
  }
}

// src/observability/redact.ts
var PATTERNS = [
  [/capyd_[A-Za-z0-9_-]{6,}/gu, "capyd_\u2026"],
  [/capy_[A-Za-z0-9_-]{6,}/gu, "capy_\u2026"],
  [/(authorization\s*[:=]\s*bearer\s+)[^\s"',}]+/giu, "$1[redacted]"],
  [/(cookie\s*[:=]\s*)[^"',}\n]+/giu, "$1[redacted]"],
  [/__client=[^;,\s"']+/gu, "__client=[redacted]"],
  [/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/gu, "[jwt]"]
];
function redact(value) {
  let text = String(value);
  for (const [pattern, replacement] of PATTERNS)
    text = text.replace(pattern, replacement);
  return text;
}
function redactFields(fields) {
  if (!fields)
    return;
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = typeof value === "string" ? redact(value) : value;
  }
  return out;
}

// src/adapters/platform/console-logger.ts
class ConsoleLogger {
  prefix;
  constructor(prefix = "capy") {
    this.prefix = prefix;
  }
  event(name, fields) {
    this.write("info", name, fields);
  }
  warn(message, fields) {
    this.write("warn", message, fields);
  }
  write(level, message, fields) {
    const payload = {
      level,
      at: new Date().toISOString(),
      plugin: this.prefix,
      event: redact(message),
      ...fields ? redactFields(fields) : {}
    };
    try {
      console.error(JSON.stringify(payload));
    } catch {}
  }
}

// src/adapters/platform/memory-cache.ts
class MemoryCache {
  entries = new Map;
  now;
  constructor(now = Date.now) {
    this.now = now;
  }
  get(key) {
    const hit = this.entries.get(key);
    if (!hit)
      return;
    if (hit.expiresAt <= this.now()) {
      this.entries.delete(key);
      return;
    }
    return hit.value;
  }
  set(key, value, ttlMs) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0)
      return;
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }
  delete(key) {
    this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
  }
}

// src/adapters/platform/proxy-fetch.ts
import { execFileSync as execFileSync2 } from "child_process";
var REG_PATH = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
var PROXY_KEYS = [
  "MAGPIE_CAPY_PROXY",
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy"
];
var LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);
var SYSTEM_PROXY_TTL_MS = 60000;
var cachedSystemProxy = { at: 0, value: "" };
function regQuery(name) {
  if (process.platform !== "win32")
    return "";
  const reg = `${process.env.SystemRoot || "C:\\Windows"}\\System32\\reg.exe`;
  try {
    const out = execFileSync2(reg, ["query", REG_PATH, "/v", name], {
      encoding: "utf8",
      timeout: 2500,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const match = new RegExp(`${name}\\s+REG_\\w+\\s+(.+?)\\s*$`, "imu").exec(out);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}
function normalizeProxyUrl(raw) {
  let text = String(raw ?? "").trim().replace(/^"|"$/gu, "");
  if (!text)
    return "";
  if (text === "off" || text === "false" || text === "none")
    return "";
  if (/^[a-z]+=/iu.test(text) && text.includes(";")) {
    const map = new Map;
    for (const part of text.split(";")) {
      const [key, value] = part.split("=");
      if (key && value)
        map.set(key.trim().toLowerCase(), value.trim());
    }
    text = map.get("https") ?? map.get("http") ?? "";
  }
  if (!text)
    return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//iu.test(text))
    text = `http://${text}`;
  try {
    const url = new URL(text);
    if (!url.hostname)
      return "";
    return url.toString().replace(/\/$/u, "");
  } catch {
    return "";
  }
}
function systemProxy() {
  if (process.platform !== "win32")
    return "";
  if (Date.now() - cachedSystemProxy.at < SYSTEM_PROXY_TTL_MS)
    return cachedSystemProxy.value;
  const enabled = regQuery("ProxyEnable").toLowerCase();
  const server = regQuery("ProxyServer");
  const value = /0x0*1\b|^1$/iu.test(enabled) || !enabled && server ? normalizeProxyUrl(server) : "";
  cachedSystemProxy = { at: Date.now(), value };
  return value;
}
function hostMatchesNoProxy(host, noProxy) {
  const rules = String(noProxy ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0)
    return false;
  const plain = host.toLowerCase();
  for (const rule of rules) {
    if (rule === "*")
      return true;
    const value = rule.replace(/^\./u, "").replace(/^\[|\]$/gu, "");
    if (plain === value || plain.endsWith(`.${value}`))
      return true;
  }
  return false;
}
function resolveProxyUrl(options = {}) {
  if (options.proxy === false)
    return "";
  if (typeof options.proxy === "string" && options.proxy.trim())
    return normalizeProxyUrl(options.proxy);
  const env = options.env ?? process.env;
  for (const key of PROXY_KEYS) {
    const value = normalizeProxyUrl(env[key]);
    if (value)
      return value;
  }
  return systemProxy();
}
function proxyConnectionError(error) {
  return /ECONNREFUSED|ConnectionRefused|Unable to connect|proxy connect|proxy server/iu.test(String(error?.message ?? error));
}
function createProxyFetch(baseFetch, proxyUrl, options = {}) {
  const url = proxyUrl;
  if (!url)
    return baseFetch;
  let warned = false;
  let undiciAgent = null;
  let undiciTried = false;
  const warn = (message) => {
    if (warned)
      return;
    warned = true;
    options.onWarn?.(message);
  };
  return async function proxyFetch(input, init = {}) {
    const target = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    let host = "";
    try {
      host = new URL(target).hostname.replace(/^\[|\]$/gu, "");
    } catch {}
    if (host && (LOCAL_HOSTS.has(host) || hostMatchesNoProxy(host, process.env.NO_PROXY ?? process.env.no_proxy))) {
      return baseFetch(input, init);
    }
    if (typeof Bun !== "undefined") {
      const withProxy = { ...init, proxy: url };
      try {
        return await baseFetch(input, withProxy);
      } catch (error) {
        if (proxyConnectionError(error)) {
          warn(`\u4EE3\u7406 ${url} \u8FDE\u63A5\u5931\u8D25\uFF0C\u672C\u6B21\u76F4\u8FDE`);
          return baseFetch(input, init);
        }
        try {
          return await fetch(input, withProxy);
        } catch (inner) {
          if (proxyConnectionError(inner)) {
            warn(`\u4EE3\u7406 ${url} \u8FDE\u63A5\u5931\u8D25\uFF0C\u672C\u6B21\u76F4\u8FDE`);
            return baseFetch(input, init);
          }
          throw error;
        }
      }
    }
    if (!undiciTried) {
      undiciTried = true;
      try {
        const undici = await import("undici");
        if (typeof undici.ProxyAgent === "function")
          undiciAgent = new undici.ProxyAgent(url);
      } catch {
        undiciAgent = null;
      }
    }
    if (undiciAgent) {
      const withDispatcher = { ...init, dispatcher: undiciAgent };
      try {
        return await baseFetch(input, withDispatcher);
      } catch (error) {
        warn(`\u4EE3\u7406 ${url} \u8BF7\u6C42\u5931\u8D25\uFF0C\u672C\u6B21\u76F4\u8FDE\uFF1A${error instanceof Error ? error.message : String(error)}`);
        return baseFetch(input, init);
      }
    }
    warn(`\u68C0\u6D4B\u5230\u4EE3\u7406 ${url}\uFF0C\u4F46\u5F53\u524D Node \u8FD0\u884C\u65F6\u4E0D\u652F\u6301 fetch \u4EE3\u7406\uFF08\u672A\u5B89\u88C5 undici\uFF09\u3002` + "\u8BF7\u6539\u7528 magpie \u81EA\u5E26 Bun \u8FD0\u884C\u65F6\uFF0C\u6216\u8BBE\u7F6E NODE_OPTIONS=--use-env-proxy \u540E\u91CD\u542F\u3002");
    return baseFetch(input, init);
  };
}

// src/adapters/platform/system-clock.ts
class SystemClock {
  now() {
    return Date.now();
  }
  async sleep(ms, signal) {
    await new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      let timer;
      const onAbort = () => {
        if (timer !== undefined)
          clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, Math.max(0, ms));
      timer.unref?.();
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
}

// src/adapters/platform/ulid.ts
import { randomBytes, randomUUID } from "crypto";
var ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(now = Date.now(), random = randomBytes(10)) {
  let time = Math.max(0, Number(now) || 0);
  const timeChars = new Array(10);
  for (let i = 9;i >= 0; i -= 1) {
    timeChars[i] = ALPHABET[time % 32] ?? "0";
    time = Math.floor(time / 32);
  }
  let bits = 0n;
  for (const byte of random)
    bits = bits << 8n | BigInt(byte);
  const randomChars = new Array(16);
  for (let i = 15;i >= 0; i -= 1) {
    randomChars[i] = ALPHABET[Number(bits & 31n)] ?? "0";
    bits >>= 5n;
  }
  return timeChars.join("") + randomChars.join("");
}

class SystemIds {
  ulid(now) {
    return ulid(now);
  }
  uuid() {
    return randomUUID();
  }
}

// src/adapters/host/magpie-auth.ts
function parseRefresh(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value;
    const clientJwt = typeof record.clientJwt === "string" ? record.clientJwt : "";
    const sessionId = typeof record.sessionId === "string" ? record.sessionId : "";
    if (!clientJwt || !sessionId)
      return null;
    return {
      clientJwt,
      sessionId,
      ...typeof record.orgId === "string" && record.orgId ? { orgId: record.orgId } : {},
      ...typeof record.userId === "string" && record.userId ? { userId: record.userId } : {},
      ...typeof record.clientId === "string" && record.clientId ? { clientId: record.clientId } : {}
    };
  }
  const text = String(value ?? "").trim();
  if (!text.startsWith("{"))
    return null;
  try {
    return parseRefresh(JSON.parse(text));
  } catch {
    return null;
  }
}
function sessionOfAuth(auth) {
  const record = auth && typeof auth === "object" && !Array.isArray(auth) ? auth : {};
  const access = typeof record.access === "string" ? record.access.trim() : "";
  if (!access)
    throw new CapyError("sign_in_required", "Capy \u672A\u767B\u5F55\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
  const refresh = parseRefresh(record.refresh);
  if (!refresh)
    throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u6001\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
  const metadata = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? record.metadata : {};
  const orgId = refresh.orgId || (typeof metadata.orgId === "string" ? metadata.orgId : "");
  if (!orgId)
    throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u6001\u7F3A\u5C11\u7EC4\u7EC7\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
  const uid = refresh.userId || (typeof metadata.userId === "string" ? metadata.userId : "") || (typeof record.uid === "string" ? record.uid : "");
  const accountId = typeof record.accountId === "string" && record.accountId ? record.accountId : uid || access.slice(-8);
  return {
    accountId,
    uid,
    orgId,
    clientId: refresh.clientId || (typeof metadata.clientId === "string" ? metadata.clientId : ""),
    accessToken: access,
    clerk: { clientJwt: refresh.clientJwt, sessionId: refresh.sessionId },
    source: "refresh",
    ...typeof metadata.name === "string" && metadata.name ? { displayName: metadata.name } : {}
  };
}
function authRecordOf(session) {
  return {
    type: "success",
    access: session.accessToken,
    refresh: JSON.stringify({
      v: 1,
      clientJwt: session.clerk.clientJwt,
      sessionId: session.clerk.sessionId,
      orgId: session.orgId,
      userId: session.uid,
      clientId: session.clientId
    }),
    expires: Date.now() + SESSION_TTL_MS,
    accountId: session.accountId,
    uid: session.uid,
    metadata: {
      name: session.displayName ?? session.accountId,
      userId: session.uid,
      orgId: session.orgId,
      clientId: session.clientId,
      source: session.source
    }
  };
}

// src/domain/model.ts
var EXTRA_FREE_MODELS = [
  {
    id: "zai/glm-5.3-flash-ads",
    name: "GLM-5.3-Flash (Free with ads)",
    reasoningModes: ["low", "high", "max"]
  },
  {
    id: "deepseek/deepseek-v4.1-flash-ads",
    name: "DeepSeek V4.1 Flash (Free with ads)",
    reasoningModes: ["none", "low", "high", "max"]
  }
];
var ADS_MODEL_IDS = new Set(EXTRA_FREE_MODELS.map((model) => model.id));
var FREE_MODEL_IDS = new Set(["particle/particle-1", ...ADS_MODEL_IDS]);
function isFreeModel(id) {
  return FREE_MODEL_IDS.has(String(id).trim());
}
function isAdsModel(id) {
  return ADS_MODEL_IDS.has(String(id).trim());
}
function normalizeModes(modes) {
  if (!modes)
    return [];
  const seen = new Set;
  for (const raw of modes) {
    const mode = String(raw).trim().toLowerCase();
    if (mode)
      seen.add(mode);
  }
  return [...seen];
}
function describeModel(raw, options) {
  const id = String(raw.id).trim();
  const name = String(raw.name ?? "").trim() || id;
  const reasoningModes = normalizeModes(raw.reasoningModes);
  return {
    id,
    name,
    free: isFreeModel(id),
    reasoningModes,
    capabilities: {
      text: true,
      image: true,
      pdf: true,
      attachment: true,
      tools: options.toolsEnabled
    }
  };
}
function mergeCatalog(live, extras = EXTRA_FREE_MODELS) {
  const seen = new Set(live.map((item) => item.id));
  return [...live, ...extras.filter((item) => !seen.has(item.id))];
}
function freeFirst(models) {
  return [...models].sort((a, b) => Number(isFreeModel(b.id)) - Number(isFreeModel(a.id)));
}
function resolveModel(requested, models) {
  const wanted = typeof requested === "string" ? requested.trim() : "";
  if (!wanted)
    throw new CapyError("invalid_request", "\u7F3A\u5C11 model");
  if (models.length === 0)
    throw new CapyError("model_not_found", "Capy \u6A21\u578B\u76EE\u5F55\u4E3A\u7A7A");
  const strip = (value) => value.replace(/^capy\//iu, "");
  const target = strip(wanted);
  const byId = models.find((model) => model.id === wanted || model.id === target);
  if (byId)
    return byId;
  const short = target.split("/").pop() ?? target;
  const byShort = models.find((model) => (model.id.split("/").pop() ?? model.id) === short);
  if (byShort)
    return byShort;
  const normalize = (value) => value.toLowerCase().replace(/[\s._-]+/gu, "");
  const norm = normalize(target);
  const byName = models.find((model) => normalize(model.name) === norm || normalize(model.id) === norm);
  if (byName)
    return byName;
  throw new CapyError("model_not_found", `Capy \u4E0D\u8BA4\u8BC6\u6A21\u578B "${wanted}"`, { detail: wanted });
}
function reasoningModeOf(request, model) {
  const raw = String(request.reasoningEffort ?? "").trim().toLowerCase();
  if (!raw || !model)
    return "";
  return model.reasoningModes.includes(raw) ? raw : "";
}

// src/entry/magpie-models.ts
var SDK = "@ai-sdk/openai-compatible";
function toMagpieModel(model, providerId) {
  const variants = model.reasoningModes.length > 0 ? Object.fromEntries(model.reasoningModes.map((mode) => [mode, {}])) : undefined;
  const ads = isAdsModel(model.id);
  return {
    id: model.id,
    providerID: providerId,
    name: ads ? `${model.name} \xB7 US/CA/UK/AU/NZ/IE` : model.name,
    ...ads ? { description: "Free with ads \u2014 only US / CA / UK / AU / NZ / IE egress IP" } : {},
    free: model.free,
    tool_call: model.capabilities.tools,
    attachment: model.capabilities.attachment,
    api: { id: model.id, url: CAPY_PUBLIC, npm: SDK },
    status: "active",
    headers: {},
    options: {},
    limit: {},
    modalities: { input: ["text", ...model.capabilities.image ? ["image"] : []], output: ["text"] },
    capabilities: {
      temperature: false,
      reasoning: model.reasoningModes.length > 0,
      attachment: model.capabilities.attachment,
      toolcall: model.capabilities.tools,
      input: {
        text: model.capabilities.text,
        image: model.capabilities.image,
        audio: false,
        video: false,
        pdf: model.capabilities.pdf
      },
      output: { text: true, image: false, audio: false, video: false, pdf: false },
      interleaved: false
    },
    ...variants ? { variants } : {}
  };
}
function modelMap(models, providerId) {
  return Object.fromEntries(models.map((model) => [model.id, toMagpieModel(model, providerId)]));
}
function staticModels(providerId, toolsEnabled) {
  const models = freeFirst(mergeCatalog(STATIC_CATALOG, EXTRA_FREE_MODELS).map((raw) => describeModel(raw, { toolsEnabled })));
  return modelMap(models, providerId);
}

// src/domain/chat.ts
function isTextPart(part) {
  return part.type === "text" || part.type === "input_text" || part.type === "output_text";
}
function isImagePart(part) {
  return part.type === "image_url" || part.type === "input_image" || part.type === "image";
}
function isFilePart(part) {
  return part.type === "file" || part.type === "input_file";
}
function partMarker(part) {
  if (isImagePart(part))
    return `[\u56FE\u7247: ${part.name ?? "image"}]`;
  return `[\u9644\u4EF6: ${part.name ?? "file"}]`;
}
function textOfContent(content) {
  if (typeof content === "string")
    return content;
  const parts = [];
  for (const part of content) {
    if (isTextPart(part))
      parts.push(part.text);
    else
      parts.push(partMarker(part));
  }
  return parts.join(`
`);
}
function buildPrompt(messages, options = {}) {
  if (messages.length === 0)
    throw promptError("messages \u4E3A\u7A7A");
  const systems = [];
  const turns = [];
  for (const message of messages) {
    const text = textOfContent(message.content).trim();
    if (message.role === "system" || message.role === "developer") {
      if (text)
        systems.push(text);
      continue;
    }
    if (message.role === "user") {
      if (text)
        turns.push({ role: "user", text });
      continue;
    }
    if (message.role === "assistant") {
      const tools = (message.toolCalls ?? []).map((call) => call.name).filter(Boolean);
      const suffix = tools.length > 0 ? ` [\u8C03\u7528\u5DE5\u5177: ${tools.join(", ")}]` : "";
      if (text || suffix)
        turns.push({ role: "assistant", text: `${text}${suffix}`.trim() });
      continue;
    }
    if (message.role === "tool") {
      const name = message.name ?? message.toolCallId ?? "tool";
      turns.push({ role: "tool", name, text: text || "(\u65E0\u8F93\u51FA)" });
    }
  }
  if (turns.length === 0)
    throw promptError("messages \u91CC\u6CA1\u6709 user/assistant \u5185\u5BB9");
  const toolInstruction = options.toolInstruction ?? "";
  if (turns.length === 1 && turns[0]?.role === "user") {
    const only = turns[0].text;
    let text = systems.length > 0 ? `<system>
${systems.join(`

`)}
</system>

<user>
${only}
</user>` : only;
    if (toolInstruction.length > 0)
      text += `

${toolInstruction}`;
    return text;
  }
  const blocks = [];
  if (systems.length > 0)
    blocks.push(`<system>
${systems.join(`

`)}
</system>`);
  blocks.push("<conversation>");
  for (const turn of turns) {
    if (turn.role === "tool")
      blocks.push(`<tool name="${turn.name ?? "tool"}">
${turn.text}
</tool>`);
    else
      blocks.push(`<${turn.role}>
${turn.text}
</${turn.role}>`);
  }
  blocks.push("</conversation>");
  const last = turns[turns.length - 1];
  blocks.push(last?.role === "assistant" ? "Continue the last assistant message." : "Reply to the last user message.");
  if (toolInstruction.length > 0)
    blocks.push(toolInstruction);
  return blocks.join(`

`);
}
function promptError(message) {
  return new CapyError("invalid_request", message);
}

// src/application/attachments.ts
var MAX_ATTACHMENT_BYTES = 262144000;
var MAX_REDIRECTS = 3;
var REMOTE_TIMEOUT_MS = 30000;
var DATA_URL = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/u;
var BARE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/u;
var PRIVATE_HOST = /^(?:localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|::1$|\[::1\]$|\[::\]$|fe80:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|.*\.local$)/iu;
function mediaTypeOf(value, fallback = "application/octet-stream") {
  const text = String(value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/u.test(text) ? text : fallback;
}
function safeName(name, mediaType, index) {
  const base = String(name ?? "").split(/[\\/]/u).pop()?.replace(/[\u0000-\u001f<>:"|?*]/gu, "").trim();
  if (base)
    return base.slice(0, 200);
  const ext = mediaType.split("/")[1]?.replace(/[^a-z0-9]/giu, "") || "bin";
  return `attachment-${index + 1}.${ext}`;
}
function assertSize(bytes, name) {
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new CapyError("invalid_request", `\u9644\u4EF6 ${name} \u8D85\u8FC7 250 MB\uFF08\u5355\u6587\u4EF6\u4E0A\u9650\uFF09`);
  }
}
function decodeDataUrl(value, fallbackType) {
  const match = DATA_URL.exec(value);
  if (!match)
    throw new CapyError("invalid_request", "\u9644\u4EF6 data URL \u65E0\u6CD5\u89E3\u6790");
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
    throw new CapyError("invalid_request", "\u9644\u4EF6 data URL \u5185\u5BB9\u65E0\u6CD5\u89E3\u7801", { cause: error });
  }
}
function assertPublicUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new CapyError("invalid_request", "\u9644\u4EF6 URL \u4E0D\u662F\u5408\u6CD5\u5730\u5740");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CapyError("invalid_request", "\u9644\u4EF6\u53EA\u652F\u6301 http/https URL \u6216 data URL");
  }
  if (PRIVATE_HOST.test(url.hostname)) {
    throw new CapyError("invalid_request", "\u9644\u4EF6 URL \u6307\u5411\u672C\u673A/\u5185\u7F51\u5730\u5740\uFF0C\u5DF2\u62D2\u7EDD\uFF08SSRF\uFF09");
  }
  return url;
}
function timeoutSignal(parent) {
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
  timer.unref?.();
  const onAbort = () => controller.abort();
  if (parent) {
    if (parent.aborted)
      controller.abort();
    else
      parent.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onAbort);
    }
  };
}
async function fetchWithSafeRedirects(fetchImpl, raw, signal) {
  let url = assertPublicUrl(raw);
  for (let hop = 0;hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "image/*,application/pdf,*/*;q=0.8" },
      redirect: "manual",
      ...signal ? { signal } : {}
    });
    if (response.status < 300 || response.status >= 400)
      return response;
    const location = response.headers.get("location");
    if (!location)
      return response;
    if (hop === MAX_REDIRECTS) {
      throw new CapyError("invalid_request", "\u8FDC\u7A0B\u9644\u4EF6\u91CD\u5B9A\u5411\u6B21\u6570\u8FC7\u591A");
    }
    url = assertPublicUrl(new URL(location, url).toString());
  }
  throw new CapyError("invalid_request", "\u8FDC\u7A0B\u9644\u4EF6\u91CD\u5B9A\u5411\u6B21\u6570\u8FC7\u591A");
}
async function readLimitedBody(response, name) {
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_ATTACHMENT_BYTES) {
    throw new CapyError("invalid_request", `\u9644\u4EF6 ${name} \u8D85\u8FC7 250 MB\uFF08\u5355\u6587\u4EF6\u4E0A\u9650\uFF09`);
  }
  if (!response.body)
    return new Uint8Array;
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;; ) {
      const { done, value } = await reader.read();
      if (done)
        break;
      total += value.byteLength;
      if (total > MAX_ATTACHMENT_BYTES) {
        await reader.cancel().catch(() => {});
        throw new CapyError("invalid_request", `\u9644\u4EF6 ${name} \u8D85\u8FC7 250 MB\uFF08\u5355\u6587\u4EF6\u4E0A\u9650\uFF09`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}
async function readRemote(fetchImpl, raw, name, signal) {
  const timeout = timeoutSignal(signal);
  try {
    let response;
    try {
      response = await fetchWithSafeRedirects(fetchImpl, raw, timeout.signal);
    } catch (error) {
      if (signal?.aborted)
        throw error;
      if (error instanceof CapyError)
        throw error;
      throw new CapyError("upstream_unavailable", "\u4E0B\u8F7D\u8FDC\u7A0B\u9644\u4EF6\u5931\u8D25", { cause: error });
    }
    if (!response.ok) {
      throw new CapyError("invalid_request", `\u4E0B\u8F7D\u8FDC\u7A0B\u9644\u4EF6\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
    }
    const mediaType = mediaTypeOf(response.headers.get("content-type"));
    const bytes = await readLimitedBody(response, name);
    assertSize(bytes, name);
    return {
      candidate: { name, mediaType, bytes },
      marker: `${/^image\//u.test(mediaType) ? "[\u56FE\u7247" : "[\u9644\u4EF6"}: ${name}]`
    };
  } finally {
    timeout.cleanup();
  }
}
async function resolvePart(fetchImpl, part, index, signal) {
  const image = isImagePart(part);
  const fallbackType = image ? "image/png" : part.mediaType ?? "application/octet-stream";
  const source = image ? part.url : part.data ?? part.url ?? "";
  const name = safeName(part.name, fallbackType, index);
  if (!source)
    throw new CapyError("invalid_request", "\u9644\u4EF6\u7F3A\u5C11\u5185\u5BB9\uFF08data URL / http(s) URL / base64\uFF09");
  if (source.startsWith("data:")) {
    const decoded = decodeDataUrl(source, fallbackType);
    assertSize(decoded.bytes, name);
    const marker = `${/^image\//u.test(decoded.mediaType) ? "[\u56FE\u7247" : "[\u9644\u4EF6"}: ${name}]`;
    return { candidate: { name, mediaType: decoded.mediaType, bytes: decoded.bytes }, marker };
  }
  if (/^https?:\/\//iu.test(source)) {
    return readRemote(fetchImpl, source, name, signal);
  }
  const text = source.trim();
  if (BARE_BASE64.test(text) && text.length % 4 === 0) {
    const bytes = Buffer.from(text, "base64");
    assertSize(bytes, name);
    const marker = `${/^image\//u.test(fallbackType) ? "[\u56FE\u7247" : "[\u9644\u4EF6"}: ${name}]`;
    return { candidate: { name, mediaType: fallbackType, bytes }, marker };
  }
  throw new CapyError("invalid_request", "\u9644\u4EF6\u5185\u5BB9\u4E0D\u662F data URL / http(s) URL / base64");
}
async function collectAttachments(messages, options) {
  const plans = [];
  let attachmentIndex = 0;
  for (let mi = 0;mi < messages.length; mi += 1) {
    const message = messages[mi];
    if (!message || typeof message.content === "string")
      continue;
    for (let pi = 0;pi < message.content.length; pi += 1) {
      const part = message.content[pi];
      if (!part || isTextPart(part))
        continue;
      if (!isImagePart(part) && !isFilePart(part))
        continue;
      plans.push({ message: mi, part: pi, value: part, attachmentIndex });
      attachmentIndex += 1;
    }
  }
  const resolved = await Promise.all(plans.map((plan) => resolvePart(options.fetchImpl, plan.value, plan.attachmentIndex, options.signal)));
  const byPart = new Map;
  for (let i = 0;i < plans.length; i += 1) {
    const plan = plans[i];
    const value = resolved[i];
    if (plan && value)
      byPart.set(`${plan.message}:${plan.part}`, value);
  }
  const cleaned = [];
  for (let mi = 0;mi < messages.length; mi += 1) {
    const message = messages[mi];
    if (!message)
      continue;
    if (typeof message.content === "string") {
      cleaned.push(message);
      continue;
    }
    const parts = [];
    for (let pi = 0;pi < message.content.length; pi += 1) {
      const part = message.content[pi];
      if (!part)
        continue;
      if (isTextPart(part)) {
        parts.push(part);
        continue;
      }
      const hit = byPart.get(`${mi}:${pi}`);
      if (hit)
        parts.push({ type: "text", text: hit.marker });
    }
    cleaned.push({ ...message, content: parts });
  }
  return { messages: cleaned, attachments: resolved.map((item) => item.candidate) };
}

// src/application/device.ts
class DeviceUseCase {
  runtime;
  inflight = new Map;
  constructor(runtime) {
    this.runtime = runtime;
  }
  async ensure(session, signal) {
    const key = accountKey(session);
    const hit = this.inflight.get(key);
    if (hit)
      return await hit;
    const task = this.runtime.ensure(session, signal);
    this.inflight.set(key, task);
    try {
      return await task;
    } finally {
      this.inflight.delete(key);
    }
  }
  close() {
    this.inflight.clear();
    this.runtime.close();
  }
}

// src/application/catalog.ts
var DEFAULT_TTL_MS = 10 * 60000;

class CatalogUseCase {
  options;
  constructor(options) {
    this.options = options;
  }
  async load(apiKey, signal, accountKey2) {
    if (signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    const cacheKey = `catalog:${accountKey2 ?? apiKey.slice(-16)}`;
    const hit = this.options.cache?.get(cacheKey);
    if (hit)
      return hit;
    const snapshot = await this.loadSnapshot(apiKey, signal);
    this.options.cache?.set(cacheKey, snapshot, this.options.cacheTtlMs ?? DEFAULT_TTL_MS);
    return snapshot;
  }
  async loadSnapshot(apiKey, signal) {
    try {
      const live = await this.options.publicPort.listModels(apiKey, signal);
      return { models: this.describe(live.items) };
    } catch (error) {
      if (isAbort(error) || signal?.aborted)
        throw error;
      if (isAuthError(error))
        throw error;
      if (this.options.fallback.length === 0) {
        throw new CapyError("upstream_unavailable", "Capy \u6A21\u578B\u76EE\u5F55\u4E0D\u53EF\u7528", { cause: error });
      }
      return { models: this.describe(this.options.fallback) };
    }
  }
  describe(raw) {
    return freeFirst(mergeCatalog(raw).map((item) => describeModel(item, {
      toolsEnabled: this.options.toolsEnabled
    })));
  }
}

// src/application/stream.ts
class PublicSseNormalizer {
  partial = new Map;
  finalText = "";
  lastText = "";
  sawDelta = false;
  errored = false;
  finished = false;
  push(frame) {
    if (this.errored || this.finished)
      return [];
    switch (frame.event) {
      case "assistant":
        return this.onAssistant(parseJson(frame.data));
      case "transcript":
        return this.onTranscript(parseJson(frame.data));
      case "error":
        return this.onError(parseJson(frame.data));
      case "done":
        this.finished = true;
        return [];
      default:
        return [];
    }
  }
  finish() {
    if (this.errored)
      return [];
    const events = [];
    const text = this.finalText || this.lastText;
    if (text)
      events.push({ type: "final", text });
    events.push({ type: "done" });
    this.finished = true;
    return events;
  }
  get text() {
    return this.finalText || this.lastText;
  }
  get hasError() {
    return this.errored;
  }
  onAssistant(payload) {
    if (!payload)
      return [];
    const callId = typeof payload.callId === "string" ? payload.callId : "";
    const piece = typeof payload.text === "string" ? payload.text : "";
    if (!callId || !piece)
      return [];
    const previous = this.partial.get(callId) ?? "";
    const grows = piece.startsWith(previous);
    const next = grows ? piece : previous + piece;
    const delta = grows ? piece.slice(previous.length) : piece;
    this.partial.set(callId, next);
    this.lastText = next;
    if (!delta)
      return [];
    this.sawDelta = true;
    return [{ type: "delta", text: delta }];
  }
  onTranscript(payload) {
    if (!payload || payload.source !== "assistant")
      return [];
    const text = typeof payload.text === "string" ? payload.text : "";
    if (!text)
      return [];
    const previous = this.lastText;
    this.finalText = text;
    this.lastText = text;
    if (!this.sawDelta) {
      this.sawDelta = true;
      return [{ type: "delta", text }];
    }
    if (previous && text.startsWith(previous) && text.length > previous.length) {
      return [{ type: "delta", text: text.slice(previous.length) }];
    }
    return [];
  }
  onError(payload) {
    const code = typeof payload?.code === "string" ? payload.code : "";
    const message = typeof payload?.message === "string" && payload.message ? payload.message : "Capy \u539F\u751F\u6D41\u8FD4\u56DE\u9519\u8BEF";
    this.errored = true;
    return [{ type: "error", error: mapCapyCode(code, message) }];
  }
}
function parseJson(value) {
  if (!value)
    return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// src/application/chat.ts
var JWT_TTL_MS = 50000;

class ChatUseCase {
  options;
  jwtCache = new Map;
  constructor(options) {
    this.options = options;
  }
  async* stream(session, request, run = {}) {
    const device = await this.options.device.ensure(session, run.signal);
    const toolInstruction = this.options.toolsEnabled ? this.options.tools.instruction(request.tools ?? [], request.toolChoice) : "";
    const prompt = buildPrompt(request.messages, { toolInstruction });
    const jwt = await this.sessionJwt(session, run.signal);
    const create = async (promptVariant) => {
      const requestId = this.options.ids.ulid();
      return await this.options.app.createJam(jwt, session.orgId, {
        jamId: `jam_${this.options.ids.ulid()}`,
        requestId,
        clientKey: requestId,
        message: prompt,
        modelId: request.model,
        deviceId: device.id,
        ...run.reasoningMode ? { reasoningMode: run.reasoningMode } : {},
        ...run.files && run.files.length > 0 ? { files: run.files } : {},
        ...promptVariant ? { promptVariant } : {},
        ...isAdsModel(request.model) ? { ads: true } : {}
      }, run.signal);
    };
    let thread;
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
      throw new CapyError("upstream_unavailable", "Capy \u6CA1\u6709\u628A\u7EBF\u7A0B\u653E\u5230\u65E0\u5934\u8BBE\u5907\uFF08\u8FD4\u56DE\u4E86\u4E91\u7AEF\u673A\u5668\uFF09");
    }
    run.onThread?.(thread);
    const detail = await this.options.app.getJam(jwt, session.orgId, thread.id, run.signal).catch(() => null);
    const blocked = askError(detail);
    if (blocked)
      throw blocked;
    const normalizer = new PublicSseNormalizer;
    try {
      for await (const frame of this.options.publicApi.streamThread(session.accessToken, thread.id, run.signal)) {
        for (const event of normalizer.push(frame))
          yield event;
      }
      if (!normalizer.text && !normalizer.hasError) {
        const failure = await this.jamFailure(jwt, session.orgId, thread.id, run.signal);
        if (failure) {
          yield { type: "error", error: failure };
          return;
        }
      }
      for (const event of normalizer.finish())
        yield event;
    } catch (error) {
      if (error instanceof CapyError) {
        yield { type: "error", error };
        return;
      }
      if (isAbort(error))
        throw error;
      yield {
        type: "error",
        error: new CapyError("upstream_unavailable", errorText(error), { cause: error })
      };
    }
  }
  async jamFailure(jwt, orgId, jamId, signal) {
    const detail = await this.options.app.getJam(jwt, orgId, jamId, signal).catch((error) => {
      throw error instanceof CapyError ? error : new CapyError("upstream_unavailable", `\u67E5\u8BE2 Capy \u7EBF\u7A0B\u72B6\u6001\u5931\u8D25\uFF1A${errorText(error)}`, { cause: error });
    });
    const blocked = askError(detail);
    if (blocked)
      return blocked;
    if (detail.status !== "failed")
      return null;
    const events = await this.options.app.getJamEvents(jwt, orgId, jamId, signal).catch(() => []);
    for (const event of [...events].reverse()) {
      if (event.kind !== "error")
        continue;
      const code = event.payload?.code ?? "";
      const message = event.payload?.message ?? "Capy \u7EBF\u7A0B\u5931\u8D25";
      return mapCapyCode(code, message);
    }
    return new CapyError("upstream_error", "Capy \u7EBF\u7A0B\u5931\u8D25\uFF0C\u4F46\u6CA1\u6709\u8FD4\u56DE\u9519\u8BEF\u8BE6\u60C5");
  }
  async cancel(session, jamId) {
    try {
      const jwt = await this.sessionJwt(session);
      await this.options.app.interruptJam(jwt, session.orgId, jamId);
    } catch {}
  }
  async sessionJwt(session, signal) {
    const key = `${accountKey(session)}:${session.clerk.sessionId}`;
    const now = this.options.clock.now();
    for (const [cachedKey, entry] of this.jwtCache) {
      if (entry.expiresAt <= now)
        this.jwtCache.delete(cachedKey);
    }
    const hit = this.jwtCache.get(key);
    if (hit)
      return hit.jwt;
    const jwt = await this.options.app.sessionJwt(session.clerk, signal);
    this.jwtCache.set(key, { jwt, expiresAt: this.options.clock.now() + JWT_TTL_MS });
    return jwt;
  }
}
function askError(detail) {
  const ask = detail?.ask;
  if (!ask)
    return null;
  if (ask.kind === "credits") {
    return new CapyError("insufficient_quota", ask.text || "Capy \u989D\u5EA6\u4E0D\u8DB3");
  }
  if (ask.kind === "desktop") {
    return new CapyError("upstream_unavailable", ask.text || "Capy \u7EBF\u7A0B\u9700\u8981\u4EBA\u5DE5/\u684C\u9762\u7AEF\u64CD\u4F5C");
  }
  return new CapyError("upstream_error", ask.text || `Capy \u7EBF\u7A0B\u963B\u585E\uFF1A${ask.kind}`);
}

// src/application/login.ts
class LoginUseCase {
  options;
  constructor(options) {
    this.options = options;
  }
  async login(method, signal) {
    const credential = method === "local" ? await this.options.sources.local(signal) : await this.options.sources.browser(signal);
    return this.complete(credential, signal);
  }
  async complete(credential, signal) {
    if (!credential.clientJwt || !credential.sessionId) {
      throw new CapyError("sign_in_required", "Capy \u767B\u5F55\u51ED\u636E\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
    }
    const clerk = { clientJwt: credential.clientJwt, sessionId: credential.sessionId };
    const jwt = await this.options.app.sessionJwt(clerk, signal);
    const me = await this.options.app.me(jwt, signal);
    const orgs = await this.options.app.organizations(jwt, signal);
    const ids = orgs.map((org) => org.id);
    const wanted = String(credential.orgId ?? "").trim();
    if (wanted && !ids.includes(wanted)) {
      throw new CapyError("invalid_request", `\u767B\u5F55\u51ED\u636E\u6307\u5B9A\u7684\u7EC4\u7EC7 ${wanted} \u4E0D\u5728\u8D26\u53F7\u7EC4\u7EC7\u5217\u8868\u91CC`);
    }
    const orgId = pickOrg(orgs, credential.orgId, me.preferredOrgId);
    if (!orgId) {
      throw new CapyError("invalid_request", ids.length > 1 ? "\u8FD9\u4E2A Capy \u8D26\u53F7\u6709\u591A\u4E2A\u7EC4\u7EC7\uFF0C\u8BF7\u5728\u767B\u5F55\u51ED\u636E\u91CC\u660E\u786E\u6307\u5B9A org" : "\u8FD9\u4E2A Capy \u8D26\u53F7\u6CA1\u6709\u7EC4\u7EC7\uFF08org\uFF09\uFF0C\u8BF7\u5148\u5728 Capy \u91CC\u5B8C\u6210\u521D\u59CB\u5316");
    }
    const key = await this.options.app.mintApiKey(jwt, orgId, this.options.apiKeyName ?? "magpie-plugin", signal);
    const uid = String(me.id || credential.userId).trim();
    const accountId = accountNameOf(me) || credential.accountId || uid;
    const clientId = String(credential.clientId ?? "").trim();
    return {
      accountId,
      uid,
      orgId,
      clientId,
      accessToken: key.plaintext,
      clerk,
      source: credential.source,
      ...accountId ? { displayName: accountId } : {}
    };
  }
}
function pickOrg(orgs, fromCredential, preferred) {
  const ids = orgs.map((org) => org.id);
  const wanted = String(fromCredential ?? "").trim();
  if (wanted && ids.includes(wanted))
    return wanted;
  const pref = String(preferred ?? "").trim();
  if (pref && ids.includes(pref))
    return pref;
  if (ids.length === 1)
    return ids[0] ?? "";
  return "";
}
function accountNameOf(me) {
  const email = String(me.email ?? "").trim();
  if (email)
    return email;
  const first = String(me.firstName ?? "").trim();
  const last = String(me.lastName ?? "").trim();
  return `${first}${last ? ` ${last}` : ""}`.trim();
}

// src/application/tools.ts
var FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/iu;
function functionOf(tool) {
  const name = String(tool.function.name ?? "").trim();
  if (!name)
    return null;
  return {
    name,
    description: String(tool.function.description ?? "").trim(),
    parameters: tool.function.parameters ?? { type: "object", properties: {} }
  };
}
function forcedName(toolChoice) {
  if (!toolChoice || typeof toolChoice !== "object")
    return "";
  const value = toolChoice;
  return typeof value.function?.name === "string" ? value.function.name : typeof value.name === "string" ? value.name : "";
}

class PromptToolBridge {
  instruction(tools, toolChoice) {
    const defs = tools.map(functionOf).filter((item) => Boolean(item));
    if (defs.length === 0)
      return "";
    const forced = forcedName(toolChoice);
    const required = forced || toolChoice === "required";
    const lines = [
      "# Tools",
      "You can call these tools when the user's request needs them:",
      JSON.stringify(defs, null, 2),
      "",
      "To call a tool, reply with exactly one JSON object and nothing else:",
      '{"tool_calls":[{"name":"<tool_name>","arguments":{}}]}',
      "Do not wrap the JSON in a code fence. Do not add text before or after it.",
      "If no tool is needed, answer normally in text."
    ];
    if (forced)
      lines.push(`You must call the tool "${forced}" now.`);
    else if (required)
      lines.push("You must call at least one tool now.");
    return lines.join(`
`);
  }
  parse(text) {
    const direct = normalizeCalls(tryJson(text));
    if (direct)
      return { calls: direct };
    for (const candidate of balancedObjects(text)) {
      const calls = normalizeCalls(tryJson(candidate));
      if (calls)
        return { calls };
    }
    return null;
  }
}
function normalizeArguments(value) {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text)
      return "{}";
    try {
      return JSON.stringify(JSON.parse(text) ?? {});
    } catch {
      return text;
    }
  }
  if (value === undefined || value === null)
    return "{}";
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}
function normalizeCalls(value) {
  if (!value || typeof value !== "object")
    return null;
  const record = value;
  const raw = Array.isArray(record.tool_calls) ? record.tool_calls : Array.isArray(record.calls) ? record.calls : Array.isArray(value) ? value : [value];
  const calls = [];
  for (const item of raw) {
    if (!item || typeof item !== "object")
      continue;
    const record2 = item;
    const fn = record2.function ?? record2;
    const name = typeof fn.name === "string" ? fn.name.trim() : "";
    if (!name)
      continue;
    calls.push({ name, arguments: normalizeArguments(fn.arguments) });
  }
  return calls.length > 0 ? calls : null;
}
function tryJson(text) {
  const trimmed = text.trim();
  if (!trimmed)
    return null;
  const unfenced = FENCE.exec(trimmed)?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}
function balancedObjects(text) {
  const out = [];
  const starts = [];
  let inString = false;
  let escaped = false;
  let steps = 0;
  const budget = Math.min(1e6, Math.max(1e4, text.length * 2));
  for (let i = 0;i < text.length; i += 1) {
    steps += 1;
    if (steps > budget)
      break;
    const ch = text[i];
    if (inString) {
      if (escaped)
        escaped = false;
      else if (ch === "\\")
        escaped = true;
      else if (ch === '"')
        inString = false;
      continue;
    }
    if (ch === '"')
      inString = true;
    else if (ch === "{")
      starts.push(i);
    else if (ch === "}") {
      const start = starts.pop();
      if (start === undefined)
        continue;
      if (starts.length === 0) {
        out.push(text.slice(start, i + 1));
        if (out.length >= 32)
          break;
      }
    }
  }
  return out;
}

// src/application/usage.ts
var DEFAULT_TTL_MS2 = 60000;

class UsageUseCase {
  options;
  constructor(options) {
    this.options = options;
  }
  async load(apiKey, signal, accountKey2) {
    if (signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    const key = `usage:${accountKey2 ?? apiKey.slice(-16)}`;
    const hit = this.options.cache?.get(key);
    if (hit)
      return hit;
    try {
      const [usage, balance] = await Promise.all([
        this.options.publicApi.usage(apiKey, signal),
        this.options.publicApi.balance(apiKey, signal)
      ]);
      const snapshot = buildUsage(usage, balance);
      this.options.cache?.set(key, snapshot, this.options.cacheTtlMs ?? DEFAULT_TTL_MS2);
      return snapshot;
    } catch (error) {
      if (isAbort(error) || signal?.aborted)
        throw error;
      if (isAuthError(error))
        throw error;
      return { windows: [], error: errorText(error) };
    }
  }
}
function buildUsage(usage, balance) {
  const windows = [];
  const currency = String(balance.currency ?? "USD").toUpperCase();
  const unlimited = balance.unlimited === true;
  const remaining = balance.remainingDollars;
  const hasRemaining = remaining !== null && remaining !== undefined && Number.isFinite(Number(remaining));
  const resetsAt = isoOf(balance.periodEnd);
  if (unlimited) {
    windows.push({ name: "\u4F59\u989D", used: 0, display: "\u65E0\u9650\u989D\u5EA6", unit: currency });
  } else if (hasRemaining) {
    const value = Number(remaining);
    windows.push({
      name: "\u4F59\u989D",
      used: value > 0 ? 0 : 100,
      display: value > 0 ? `${money(value, currency)} \u53EF\u7528` : "\u4F59\u989D\u5DF2\u7528\u5C3D",
      unit: currency,
      ...resetsAt ? { resetsAt } : {}
    });
  } else {
    windows.push({
      name: "\u4F59\u989D",
      used: 100,
      display: "\u65E0\u53EF\u7528\u4F59\u989D / \u672A\u8BA2\u9605",
      ...resetsAt ? { resetsAt } : {}
    });
  }
  const tokens = tokensText(usage.tokens);
  if (tokens) {
    windows.push({ name: "Token", used: 0, aside: true, display: tokens, unit: "tokens" });
  }
  return {
    windows,
    ...unlimited ? { plan: "Unlimited" } : {},
    ...hasRemaining ? { balance: money(Number(remaining), currency) } : {}
  };
}
function withDeviceWindow(snapshot, device) {
  return {
    ...snapshot,
    windows: [
      ...snapshot.windows,
      {
        name: "\u65E0\u5934\u8BBE\u5907",
        used: device.connected ? 0 : 100,
        aside: true,
        display: device.connected ? `\u5DF2\u8FDE\u63A5${device.name ? ` \xB7 ${device.name}` : ""}` : "\u672A\u8FDE\u63A5\uFF08\u81EA\u52A8\u6CE8\u518C\u5931\u8D25\uFF0C\u770B\u63D2\u4EF6\u65E5\u5FD7\uFF09"
      }
    ]
  };
}
function money(value, currency = "USD") {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${value.toFixed(value >= 100 ? 0 : 2)}`;
}
function tokensText(tokens) {
  const input = Number(tokens?.inputTokens);
  const output = Number(tokens?.outputTokens);
  if (!Number.isFinite(input) && !Number.isFinite(output))
    return "";
  const compact = (value) => {
    if (!Number.isFinite(value))
      return "0";
    if (value >= 1e6)
      return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1000)
      return `${(value / 1000).toFixed(1)}k`;
    return String(value);
  };
  return `\u8F93\u5165 ${compact(input)} / \u8F93\u51FA ${compact(output)} tokens`;
}
function isoOf(value) {
  if (value === null || value === undefined || value === "")
    return;
  if (typeof value === "number") {
    return new Date(value > 1000000000000 ? value : value * 1000).toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// src/protocol/openai.ts
function parseChatRequest(body) {
  if (!isRecord(body))
    throw invalid("\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
  const messagesRaw = body.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0)
    throw invalid("messages \u4E3A\u7A7A");
  const messages = messagesRaw.map(parseMessage);
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model)
    throw invalid("\u7F3A\u5C11 model");
  const reasoning = isRecord(body.reasoning) ? body.reasoning : {};
  const reasoningEffort = typeof body.reasoning_effort === "string" ? body.reasoning_effort : typeof reasoning.effort === "string" ? reasoning.effort : undefined;
  return {
    model,
    messages,
    stream: body.stream === true,
    ...reasoningEffort ? { reasoningEffort } : {},
    ...Array.isArray(body.tools) ? { tools: body.tools.map(parseTool) } : {},
    ...body.tool_choice === undefined ? {} : { toolChoice: body.tool_choice }
  };
}
function parseMessage(value) {
  if (!isRecord(value))
    throw invalid("messages \u91CC\u6709\u975E\u5BF9\u8C61\u9879");
  const role = value.role;
  if (role !== "system" && role !== "developer" && role !== "user" && role !== "assistant" && role !== "tool") {
    throw invalid(`\u4E0D\u652F\u6301\u7684 role: ${String(role)}`);
  }
  const content = parseContent(value.content);
  const toolCalls = parseToolCalls(value.tool_calls);
  return {
    role,
    content,
    ...typeof value.name === "string" ? { name: value.name } : {},
    ...typeof value.tool_call_id === "string" ? { toolCallId: value.tool_call_id } : {},
    ...toolCalls ? { toolCalls } : {}
  };
}
function parseToolCalls(value) {
  if (!Array.isArray(value))
    return;
  const calls = [];
  for (const item of value) {
    if (!isRecord(item))
      continue;
    const fn = isRecord(item.function) ? item.function : item;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const name = typeof fn.name === "string" ? fn.name.trim() : "";
    if (!id || !name)
      continue;
    const args = fn.arguments;
    const argsText = typeof args === "string" ? args : args === undefined ? "{}" : JSON.stringify(args);
    calls.push({ id, name, arguments: argsText });
  }
  return calls.length > 0 ? calls : undefined;
}
function parseContent(value) {
  if (typeof value === "string")
    return value;
  if (!Array.isArray(value))
    return "";
  return value.map((part) => {
    if (!isRecord(part))
      throw invalid("content part \u5FC5\u987B\u662F\u5BF9\u8C61");
    const type = part.type;
    if (type === "text" || type === "input_text" || type === "output_text") {
      return { type, text: typeof part.text === "string" ? part.text : "" };
    }
    if (type === "image_url" || type === "input_image" || type === "image") {
      const raw = part.image_url;
      const url = typeof raw === "string" ? raw : isRecord(raw) && typeof raw.url === "string" ? raw.url : typeof part.url === "string" ? part.url : "";
      if (!url)
        throw invalid("image_url \u7F3A\u5C11 url");
      return {
        type,
        url,
        ...typeof part.name === "string" ? { name: part.name } : {},
        ...typeof part.media_type === "string" ? { mediaType: part.media_type } : {}
      };
    }
    if (type === "file" || type === "input_file") {
      const file = isRecord(part.file) ? part.file : part;
      const name = typeof file.filename === "string" ? file.filename : typeof file.name === "string" ? file.name : undefined;
      const data = typeof file.file_data === "string" ? file.file_data : typeof file.data === "string" ? file.data : undefined;
      const url = typeof file.url === "string" ? file.url : undefined;
      return {
        type,
        ...name ? { name } : {},
        ...typeof file.media_type === "string" ? { mediaType: file.media_type } : {},
        ...data ? { data } : {},
        ...url ? { url } : {}
      };
    }
    throw invalid(`\u4E0D\u652F\u6301\u7684 content type: ${String(type)}`);
  });
}
function parseTool(value) {
  if (!isRecord(value) || value.type !== "function" || !isRecord(value.function)) {
    throw invalid("tools \u5FC5\u987B\u662F function \u5DE5\u5177");
  }
  const fn = value.function;
  const name = typeof fn.name === "string" ? fn.name.trim() : "";
  if (!name)
    throw invalid("tool.function.name \u4E3A\u7A7A");
  return {
    type: "function",
    function: {
      name,
      ...typeof fn.description === "string" ? { description: fn.description } : {},
      ...fn.parameters === undefined ? {} : { parameters: fn.parameters }
    }
  };
}
var JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
var SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache",
  connection: "keep-alive"
};
var SSE_DONE = `data: [DONE]

`;
function encodeChunk(meta, delta, finishReason = null) {
  return `data: ${JSON.stringify({
    id: meta.id,
    object: "chat.completion.chunk",
    created: meta.created,
    model: meta.model,
    choices: [{ index: 0, delta, finish_reason: finishReason }]
  })}

`;
}
function encodeToolCallCompletion(meta, calls) {
  return new Response(JSON.stringify({
    id: meta.id,
    object: "chat.completion",
    created: meta.created,
    model: meta.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: null,
        tool_calls: calls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: call.arguments }
        }))
      },
      finish_reason: "tool_calls"
    }]
  }), { status: 200, headers: JSON_HEADERS });
}
function encodeToolCallStream(meta, calls) {
  const body = [
    encodeChunk(meta, { role: "assistant", content: null }),
    encodeChunk(meta, {
      tool_calls: calls.map((call, index) => ({
        index,
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments }
      }))
    }),
    encodeChunk(meta, {}, "tool_calls"),
    SSE_DONE
  ].join("");
  return new Response(body, { status: 200, headers: SSE_HEADERS });
}
function encodeCompletion(id, model, created, text) {
  return new Response(JSON.stringify({
    id,
    object: "chat.completion",
    created,
    model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: text },
      finish_reason: "stop"
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  }), { status: 200, headers: JSON_HEADERS });
}
function encodeErrorResponse(error) {
  const body = toOpenAiError(error);
  return new Response(JSON.stringify(body), {
    status: body.error.status,
    headers: {
      ...JSON_HEADERS,
      ...body.error.status === 401 ? { "x-magpie-sign-in": "expired" } : {}
    }
  });
}
function encodeSseError(error) {
  return `data: ${JSON.stringify(toOpenAiError(error))}

data: [DONE]

`;
}
function encodeModelList(models, provider) {
  return new Response(JSON.stringify({
    object: "list",
    data: models.map((model) => ({
      id: model.id,
      object: "model",
      created: 0,
      owned_by: provider,
      name: model.name
    }))
  }), { status: 200, headers: JSON_HEADERS });
}
function encodeChatStream(events, meta) {
  const encoder = new TextEncoder;
  const stream = new ReadableStream({
    async start(controller) {
      const push = (text) => controller.enqueue(encoder.encode(text));
      const finish = () => {
        push(encodeChunk(meta, {}, "stop"));
        push(SSE_DONE);
        controller.close();
      };
      push(encodeChunk(meta, { role: "assistant", content: "" }));
      let emitted = false;
      try {
        for await (const event of events) {
          if (event.type === "delta") {
            emitted = true;
            push(encodeChunk(meta, { content: event.text }));
          } else if (event.type === "error") {
            push(encodeSseError(event.error));
            controller.close();
            return;
          } else if (event.type === "final") {
            if (!emitted && event.text)
              push(encodeChunk(meta, { content: event.text }));
          } else if (event.type === "done") {
            finish();
            return;
          }
        }
        finish();
      } catch (error) {
        push(encodeSseError(error));
        controller.close();
      }
    }
  });
  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function invalid(message) {
  return new CapyError("invalid_request", message);
}
async function collectText(events) {
  let text = "";
  for await (const event of events) {
    if (event.type === "delta")
      text += event.text;
    else if (event.type === "final" && !text)
      text = event.text;
    else if (event.type === "error")
      throw event.error;
  }
  return text;
}
async function* textEvents(text) {
  if (text)
    yield { type: "delta", text };
  yield { type: "done" };
}

// src/entry/plugin.ts
var DEFAULT_PROVIDER_ID = "capy";
var SDK2 = "@ai-sdk/openai-compatible";
var MAX_CONCURRENCY = 2;
var REFRESH_LEAD_MS = 24 * 3600000;
function loginErrorText(error) {
  if (error instanceof CapyError)
    return error.message;
  return error instanceof Error ? error.message : String(error);
}
async function CapyPlugin(_ctx = {}, options = {}) {
  const providerId = String(options.providerId || process.env.MAGPIE_CAPY_PROVIDER_ID || DEFAULT_PROVIDER_ID).trim();
  const toolsEnabled = options.toolsEnabled !== false;
  const configuredVariant = String(options.promptVariant ?? process.env.MAGPIE_CAPY_PROMPT_VARIANT ?? "auto").trim().toLowerCase();
  const minimalUnsupported = new Set;
  const minimalAllowed = configuredVariant !== "default" && configuredVariant !== "off";
  const proxyUrl = resolveProxyUrl({
    ...options.proxy === undefined ? {} : { proxy: options.proxy }
  });
  const fetchImpl = createProxyFetch(fetch, proxyUrl, {
    onWarn: (message) => console.warn(`[magpie-capy] ${message}`)
  });
  const clock = new SystemClock;
  const ids = new SystemIds;
  const logger = new ConsoleLogger("capy");
  if (proxyUrl) {
    let host = "configured";
    try {
      const parsed = new URL(proxyUrl);
      host = `${parsed.hostname}:${parsed.port || "default"}`;
    } catch {}
    logger.event("proxy_enabled", { proxy: host });
  }
  const cache = new MemoryCache(() => clock.now());
  const app = new CapyAppClient(fetchImpl);
  const publicApi = new CapyPublicClient(fetchImpl);
  const store = new FileSecretStore;
  const runtime = new HeadlessDeviceRuntime({ app, store, clock, logger });
  const device = new DeviceUseCase(runtime);
  const login = new LoginUseCase({ app, sources: new CapyLoginSources });
  const catalog = new CatalogUseCase({
    publicPort: publicApi,
    fallback: STATIC_CATALOG,
    toolsEnabled,
    cache
  });
  const usage = new UsageUseCase({ publicApi, cache });
  const tools = new PromptToolBridge;
  const chat = new ChatUseCase({ app, publicApi, device, ids, clock, tools, toolsEnabled });
  const initialModels = staticModels(providerId, toolsEnabled);
  async function modelsFor(session) {
    try {
      const snapshot = await catalog.load(session.accessToken, undefined, accountKey(session));
      return modelMap(snapshot.models, providerId);
    } catch (error) {
      if (error instanceof CapyError && error.kind === "sign_in_required")
        throw error;
      return initialModels;
    }
  }
  async function complete(credential) {
    return authRecordOf(await login.complete(credential));
  }
  function oauthMethod(options2) {
    return {
      type: "oauth",
      label: options2.label,
      async authorize() {
        const controller = new AbortController;
        const probe = options2.start(controller.signal).then((session) => authRecordOf(session));
        probe.catch(() => {});
        return {
          url: options2.url,
          opened: true,
          method: "auto",
          instructions: options2.instructions,
          close: () => controller.abort(),
          async callback(_value, callbackOptions = {}) {
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
          }
        };
      }
    };
  }
  return {
    config: (cfg) => {
      const providers = cfg.provider ??= {};
      providers[providerId] ??= {
        name: "Capy",
        npm: SDK2,
        api: CAPY_PUBLIC,
        models: initialModels,
        searches: false
      };
    },
    auth: {
      provider: providerId,
      maxConcurrency: MAX_CONCURRENCY,
      refreshLead: REFRESH_LEAD_MS,
      methods: [
        oauthMethod({
          label: "\u4ECE\u672C\u673A Capy \u5BA2\u6237\u7AEF\u5BFC\u5165\uFF08\u53EA\u767B\u5F55\uFF0C\u4E0D\u9700\u8981\u8FD0\u884C\u684C\u9762\u7AEF\uFF09",
          url: CAPY_ORIGIN,
          instructions: "\u6B63\u5728\u8BFB\u53D6\u672C\u673A Capy \u767B\u5F55\u6001\uFF08\u53EA\u8BFB\u767B\u5F55\u51ED\u636E\uFF0C\u4E0D\u9700\u8981\u542F\u52A8 Capy \u684C\u9762\u7AEF\uFF09\u2026",
          start: (signal) => login.login("local", signal)
        }),
        oauthMethod({
          label: "\u6D4F\u89C8\u5668\u767B\u5F55\uFF08Google / GitHub / Passkey / \u90AE\u7BB1\uFF09",
          url: `${CAPY_ORIGIN}/sign-in`,
          instructions: "\u5DF2\u6253\u5F00 Capy \u5B98\u65B9\u767B\u5F55\u9875\u3002\u7528 Google\u3001GitHub\u3001Passkey \u6216\u90AE\u7BB1\u767B\u5F55\uFF1B" + "\u767B\u5F55\u6210\u529F\u540E\u4F1A\u81EA\u52A8\u8BFB\u53D6\u767B\u5F55\u6001\uFF0C\u4E0D\u9700\u8981\u590D\u5236\u4EFB\u4F55\u4E1C\u897F\u3002",
          start: (signal) => login.login("browser", signal)
        })
      ],
      async refresh(auth) {
        let session;
        try {
          session = sessionOfAuth(auth);
        } catch {
          throw Object.assign(new Error("Capy \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55"), { signIn: "expired" });
        }
        try {
          await publicApi.listModels(session.accessToken);
          return { access: session.accessToken, expires: Date.now() + SESSION_TTL_MS };
        } catch (error) {
          if (!(error instanceof CapyError) || error.kind !== "sign_in_required")
            return;
        }
        try {
          const renewed = await complete({
            clientJwt: session.clerk.clientJwt,
            sessionId: session.clerk.sessionId,
            userId: session.uid,
            orgId: session.orgId,
            clientId: session.clientId,
            source: "refresh"
          });
          return {
            access: typeof renewed.access === "string" ? renewed.access : "",
            expires: typeof renewed.expires === "number" ? renewed.expires : Date.now() + SESSION_TTL_MS
          };
        } catch {
          throw Object.assign(new Error("Capy \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55"), { signIn: "expired" });
        }
      },
      async loader(getAuth) {
        return {
          baseURL: CAPY_PUBLIC,
          apiKey: "",
          headers: {},
          async fetch(input, init = {}) {
            const auth = await getAuth();
            let session;
            try {
              session = sessionOfAuth(auth);
            } catch (error) {
              return encodeErrorResponse(error);
            }
            const request = input instanceof Request ? input : null;
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : request?.url ?? "";
            const method = String(init.method ?? request?.method ?? "GET").toUpperCase();
            const route = url.split("?")[0] ?? "";
            const signal = init.signal ?? request?.signal ?? undefined;
            try {
              if (method === "GET" && /\/models$/u.test(route)) {
                const models = await modelsFor(session);
                return encodeModelList(Object.values(models).map((model2) => ({ id: model2.id, name: model2.name })), providerId);
              }
              if (!/\/chat\/completions$/u.test(route)) {
                return encodeErrorResponse(new CapyError("not_implemented", `\u8BE5\u7AEF\u70B9\u6CA1\u6709\u5B9E\u73B0\uFF1A${method} ${url}`));
              }
              let body;
              try {
                body = await readJsonBody(input, init);
              } catch {
                return encodeErrorResponse(new CapyError("invalid_request", "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON"));
              }
              const requestBody = parseChatRequest(body);
              const snapshot = await catalog.load(session.accessToken, signal, accountKey(session));
              const model = resolveModel(requestBody.model, snapshot.models);
              const modelId = model.id;
              const reasoningMode = reasoningModeOf(requestBody, model);
              const prepared = await collectAttachments(requestBody.messages, {
                fetchImpl,
                ...signal ? { signal } : {}
              });
              const files = prepared.attachments.length > 0 ? await publicApi.uploadFiles(session.accessToken, prepared.attachments, signal) : [];
              let activeThreadId = "";
              const onAbort = () => {
                if (activeThreadId)
                  chat.cancel(session, activeThreadId);
              };
              signal?.addEventListener("abort", onAbort, { once: true });
              const events = chat.stream(session, {
                ...requestBody,
                messages: prepared.messages
              }, {
                ...signal ? { signal } : {},
                ...reasoningMode ? { reasoningMode } : {},
                ...files.length > 0 ? { files } : {},
                onThread: (thread) => {
                  activeThreadId = thread.id;
                },
                onVariantFallback: () => {
                  minimalUnsupported.add(accountKey(session));
                },
                ...minimalAllowed && !minimalUnsupported.has(accountKey(session)) ? { promptVariant: "minimal" } : {}
              });
              const meta = {
                id: `chatcmpl-${ids.ulid()}`,
                model: modelId,
                created: Math.floor(clock.now() / 1000)
              };
              const wantsTools = toolsEnabled && (requestBody.tools?.length ?? 0) > 0;
              if (wantsTools) {
                const text = await collectText(events);
                const parsed = text ? tools.parse(text) : null;
                if (parsed) {
                  const calls = parsed.calls.map((call) => ({
                    id: `call_${ids.ulid()}`,
                    name: call.name,
                    arguments: call.arguments
                  }));
                  return requestBody.stream ? encodeToolCallStream(meta, calls) : encodeToolCallCompletion(meta, calls);
                }
                return requestBody.stream ? encodeChatStream(textEvents(text), meta) : encodeCompletion(meta.id, meta.model, meta.created, text);
              }
              if (requestBody.stream)
                return encodeChatStream(events, meta);
              return encodeCompletion(meta.id, meta.model, meta.created, await collectText(events));
            } catch (error) {
              return encodeErrorResponse(error);
            }
          }
        };
      },
      async usage(getAuth) {
        let session;
        try {
          session = sessionOfAuth(await getAuth());
        } catch {
          return { error: "\u672A\u767B\u5F55", windows: [] };
        }
        try {
          const snapshot = await usage.load(session.accessToken, undefined, accountKey(session));
          let deviceWindow = { connected: false, name: "" };
          try {
            const info = await device.ensure(session);
            deviceWindow = { connected: true, name: info.name };
          } catch {
            deviceWindow = { connected: false, name: "" };
          }
          return withDeviceWindow(snapshot, deviceWindow);
        } catch (error) {
          if (error instanceof CapyError && error.kind === "sign_in_required") {
            return { error: "Capy \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", windows: [], signIn: "expired" };
          }
          return { error: loginErrorText(error), windows: [] };
        }
      }
    },
    provider: {
      id: providerId,
      async models(_fallback, context = {}) {
        try {
          return await modelsFor(sessionOfAuth(context.auth));
        } catch {
          return initialModels;
        }
      }
    }
  };
}
export {
  CapyPlugin as default
};
