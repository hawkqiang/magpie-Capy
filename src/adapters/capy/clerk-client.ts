import type { ClerkSession } from "../../domain/account.ts";
import { CapyError } from "../../domain/errors.ts";
import { decodeJwtPayload } from "../platform/jwt.ts";
import { requestJson } from "../platform/http.ts";
import { CAPY_FAPI, CAPY_ORIGIN } from "./endpoints.ts";

export class ClerkClient {
  private readonly fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch) {
    this.fetchImpl = fetchImpl;
  }

  async sessionJwt(clerk: ClerkSession, signal?: AbortSignal): Promise<string> {
    if (!clerk.clientJwt || !clerk.sessionId) {
      throw new CapyError("sign_in_required", "Capy 登录凭据不完整，请重新登录");
    }
    const url = `${CAPY_FAPI}/v1/client/sessions/${encodeURIComponent(clerk.sessionId)}/tokens`;
    const { response, body, text } = await requestJson(this.fetchImpl, url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: CAPY_ORIGIN,
        cookie: `__client=${clerk.clientJwt}`,
      },
      body: "{}",
      ...(signal ? { signal } : {}),
    }, 20_000);
    if (!response.ok) {
      throw new CapyError(
        "sign_in_required",
        `Capy 会话换票失败（HTTP ${response.status}），请重新登录`,
        { detail: text.slice(0, 200) },
      );
    }
    const record = body as { jwt?: unknown; response?: { jwt?: unknown } } | null;
    const jwt = typeof record?.jwt === "string"
      ? record.jwt
      : typeof record?.response?.jwt === "string"
        ? record.response.jwt
        : "";
    if (!jwt) throw new CapyError("upstream_error", "Capy 会话换票没有返回 JWT");
    const payload = decodeJwtPayload(jwt);
    if (payload?.azp !== CAPY_ORIGIN) {
      throw new CapyError("sign_in_required", "Capy 会话换票没有拿到 azp，请重新登录", {
        detail: `azp=${String(payload?.azp ?? "missing")}`,
      });
    }
    return jwt;
  }
}
