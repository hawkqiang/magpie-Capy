import type { AccountSession } from "../domain/account.ts";
import { CapyError } from "../domain/errors.ts";
import type { CapyAppPort, Organization } from "../ports/capy-app.ts";
import type { LoginCredential, LoginSourcePort } from "../ports/login.ts";

export interface LoginUseCaseOptions {
  readonly app: CapyAppPort;
  readonly sources: LoginSourcePort;
  readonly apiKeyName?: string;
}

export class LoginUseCase {
  private readonly options: LoginUseCaseOptions;

  constructor(options: LoginUseCaseOptions) {
    this.options = options;
  }

  async login(method: "local" | "browser", signal?: AbortSignal): Promise<AccountSession> {
    const credential = method === "local"
      ? await this.options.sources.local(signal)
      : await this.options.sources.browser(signal);
    return this.complete(credential, signal);
  }

  async complete(credential: LoginCredential, signal?: AbortSignal): Promise<AccountSession> {
    if (!credential.clientJwt || !credential.sessionId) {
      throw new CapyError("sign_in_required", "Capy 登录凭据不完整，请重新登录");
    }
    const clerk = { clientJwt: credential.clientJwt, sessionId: credential.sessionId };
    const jwt = await this.options.app.sessionJwt(clerk, signal);
    const me = await this.options.app.me(jwt, signal);
    const orgs = await this.options.app.organizations(jwt, signal);
    const ids = orgs.map((org) => org.id);
    const wanted = cleanOrg(credential.orgId);
    if (wanted && !ids.includes(wanted)) {
      throw new CapyError("invalid_request", `登录凭据指定的组织 ${wanted} 不在账号组织列表里`);
    }
    const orgId = pickOrg(orgs, credential.orgId, me.preferredOrgId);
    if (!orgId) {
      throw new CapyError(
        "invalid_request",
        ids.length > 1
          ? "这个 Capy 账号有多个组织，请在登录凭据里明确指定 org"
          : "这个 Capy 账号没有组织（org），请先在 Capy 里完成初始化",
      );
    }
    const key = await this.options.app.mintApiKey(
      jwt,
      orgId,
      this.options.apiKeyName ?? "magpie-plugin",
      signal,
    );
    const uid = String(me.id || credential.userId).trim();
    const accountId = accountNameOf(me) || credential.accountId || uid;
    // clientId 必须来自 Clerk 的 __client，不再随机生成一个假身份。
    const clientId = String(credential.clientId ?? "").trim();
    return {
      accountId,
      uid,
      orgId,
      clientId,
      accessToken: key.plaintext,
      clerk,
      source: credential.source,
      ...(accountId ? { displayName: accountId } : {}),
    };
  }
}

/** Some Capy builds store an absent org as the literal string "null"/"undefined". */
function cleanOrg(value: unknown): string {
  const v = String(value ?? "").trim();
  return v === "null" || v === "undefined" ? "" : v;
}

function pickOrg(orgs: readonly Organization[], fromCredential?: string, preferred?: string): string {
  const ids = orgs.map((org) => org.id);
  const wanted = cleanOrg(fromCredential);
  if (wanted && ids.includes(wanted)) return wanted;
  const pref = cleanOrg(preferred);
  if (pref && ids.includes(pref)) return pref;
  // 只有一个组织时没有歧义；多组织且没有明确偏好则不猜。
  if (ids.length === 1) return ids[0] ?? "";
  return "";
}

function accountNameOf(me: { email?: string; firstName?: string; lastName?: string }): string {
  const email = String(me.email ?? "").trim();
  if (email) return email;
  const first = String(me.firstName ?? "").trim();
  const last = String(me.lastName ?? "").trim();
  return `${first}${last ? ` ${last}` : ""}`.trim();
}
