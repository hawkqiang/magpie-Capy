export type ErrorKind =
  | "invalid_request"
  | "not_found"
  | "model_not_found"
  | "sign_in_required"
  | "insufficient_quota"
  | "region_unsupported"
  | "device_pair_failed"
  | "rate_limited"
  | "upstream_unavailable"
  | "upstream_timeout"
  | "upstream_error"
  | "internal_error"
  | "not_implemented";

const STATUS: Record<ErrorKind, number> = {
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
  not_implemented: 501,
};

const RETRYABLE = new Set<ErrorKind>([
  "rate_limited",
  "upstream_unavailable",
  "upstream_timeout",
]);

export class CapyError extends Error {
  readonly kind: ErrorKind;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string | undefined;

  constructor(
    kind: ErrorKind,
    message: string,
    options: { status?: number; retryable?: boolean; detail?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "CapyError";
    this.kind = kind;
    this.status = options.status ?? STATUS[kind];
    this.retryable = options.retryable ?? RETRYABLE.has(kind);
    this.detail = options.detail;
  }
}

function isCapyError(value: unknown): value is CapyError {
  return value instanceof CapyError;
}

export function isAuthError(value: unknown): boolean {
  return isCapyError(value) && value.kind === "sign_in_required";
}

export function isAbort(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: unknown }).name === "AbortError");
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Capy SSE / jam events 的 error code → 领域错误。 */
export function mapCapyCode(code: string, message: string): CapyError {
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

/** 上游 JSON / HTTP 状态 → 领域错误。 */
export function mapUpstream(status: number, body: unknown, fallback = ""): CapyError {
  const tag = tagOf(body);
  const message = messageOf(body) || fallback || `Capy upstream error (HTTP ${status})`;

  if (status === 401 || tag === "capy/Unauthorized") {
    return new CapyError("sign_in_required", "Capy 登录已失效，请重新登录", { detail: message });
  }
  if (status === 402 || tag === "capy/PaidFeatureUnavailable") {
    return new CapyError("insufficient_quota", message || "Capy 额度不足", { detail: tag });
  }
  if (status === 403 || tag === "capy/Forbidden") {
    return new CapyError("upstream_error", message || "Capy 拒绝了这个请求", { status: 403, detail: tag });
  }
  if (status === 429 || tag === "capy/RateLimited") {
    return new CapyError("rate_limited", message || "Capy 限流", { detail: tag });
  }
  if (status === 404 || tag.endsWith("NotFound")) {
    // 只有模型选择相关的 404 才是 model_not_found；线程/设备/项目 404 是资源不存在。
    const kind: ErrorKind = /model/iu.test(tag) ? "model_not_found" : "not_found";
    return new CapyError(kind, message || "Capy 资源不存在", { detail: tag });
  }
  if (status === 400 && /ModelSelection/iu.test(tag)) {
    return new CapyError("model_not_found", message || "Capy 不接受这个模型", { detail: tag });
  }
  if (status === 400) {
    return new CapyError("invalid_request", message || "Capy 认为请求不合法", { detail: tag });
  }
  if (status === 503 || tag === "capy/StreamUnavailable") {
    return new CapyError("upstream_unavailable", message || "Capy 流服务不可用", { detail: tag });
  }
  if (status >= 500) {
    return new CapyError("upstream_unavailable", message || `Capy 上游错误（HTTP ${status}）`, { detail: tag });
  }
  return new CapyError("upstream_error", message, { detail: tag });
}

function tagOf(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const tag = (body as { _tag?: unknown })._tag;
  return typeof tag === "string" ? tag : "";
}

function messageOf(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message.trim() : "";
}

export type OpenAiErrorType =
  | "authentication_error"
  | "invalid_request_error"
  | "rate_limit_error"
  | "upstream_error";

export interface OpenAiErrorBody {
  error: {
    message: string;
    type: OpenAiErrorType;
    code: string;
    status: number;
  };
}

export function toOpenAiError(error: unknown): OpenAiErrorBody {
  const kind = isCapyError(error) ? error.kind : "internal_error";
  const status = isCapyError(error) ? error.status : 502;
  const message = error instanceof Error ? error.message : String(error);
  return {
    error: {
      message,
      type: openAiErrorType(status),
      code: kind,
      status,
    },
  };
}

function openAiErrorType(status: number): OpenAiErrorType {
  if (status === 401) return "authentication_error";
  if (status === 400 || status === 404 || status === 422) return "invalid_request_error";
  if (status === 429) return "rate_limit_error";
  return "upstream_error";
}
