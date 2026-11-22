import { SESSION_TTL_MS, type AccountSession } from "../../domain/account.ts";
import { CapyError } from "../../domain/errors.ts";

interface StoredRefresh {
  readonly clientJwt: string;
  readonly sessionId: string;
  readonly orgId?: string;
  readonly userId?: string;
  readonly clientId?: string;
}

function parseRefresh(value: unknown): StoredRefresh | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const clientJwt = typeof record.clientJwt === "string" ? record.clientJwt : "";
    const sessionId = typeof record.sessionId === "string" ? record.sessionId : "";
    if (!clientJwt || !sessionId) return null;
    return {
      clientJwt,
      sessionId,
      ...(typeof record.orgId === "string" && record.orgId ? { orgId: record.orgId } : {}),
      ...(typeof record.userId === "string" && record.userId ? { userId: record.userId } : {}),
      ...(typeof record.clientId === "string" && record.clientId ? { clientId: record.clientId } : {}),
    };
  }
  const text = String(value ?? "").trim();
  if (!text.startsWith("{")) return null;
  try { return parseRefresh(JSON.parse(text)); } catch { return null; }
}

export function sessionOfAuth(auth: unknown): AccountSession {
  const record = auth && typeof auth === "object" && !Array.isArray(auth)
    ? auth as Record<string, unknown>
    : {};
  const access = typeof record.access === "string" ? record.access.trim() : "";
  if (!access) throw new CapyError("sign_in_required", "Capy 未登录，请重新登录");
  const refresh = parseRefresh(record.refresh);
  if (!refresh) throw new CapyError("sign_in_required", "Capy 登录态不完整，请重新登录");
  const metadata = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
    ? record.metadata as Record<string, unknown>
    : {};
  const orgId = refresh.orgId || (typeof metadata.orgId === "string" ? metadata.orgId : "");
  if (!orgId) throw new CapyError("sign_in_required", "Capy 登录态缺少组织，请重新登录");
  const uid = refresh.userId
    || (typeof metadata.userId === "string" ? metadata.userId : "")
    || (typeof record.uid === "string" ? record.uid : "");
  const accountId = typeof record.accountId === "string" && record.accountId
    ? record.accountId
    : uid || access.slice(-8);
  return {
    accountId,
    uid,
    orgId,
    clientId: refresh.clientId || (typeof metadata.clientId === "string" ? metadata.clientId : ""),
    accessToken: access,
    clerk: { clientJwt: refresh.clientJwt, sessionId: refresh.sessionId },
    source: "refresh",
    ...(typeof metadata.name === "string" && metadata.name ? { displayName: metadata.name } : {}),
  };
}

export function authRecordOf(session: AccountSession): Record<string, unknown> {
  return {
    type: "success",
    access: session.accessToken,
    refresh: JSON.stringify({
      v: 1,
      clientJwt: session.clerk.clientJwt,
      sessionId: session.clerk.sessionId,
      orgId: session.orgId,
      userId: session.uid,
      clientId: session.clientId,
    }),
    expires: Date.now() + SESSION_TTL_MS,
    accountId: session.accountId,
    uid: session.uid,
    metadata: {
      name: session.displayName ?? session.accountId,
      userId: session.uid,
      orgId: session.orgId,
      clientId: session.clientId,
      source: session.source,
    },
  };
}
