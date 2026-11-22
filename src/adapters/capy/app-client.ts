import type { ClerkSession } from "../../domain/account.ts";
import { CapyError } from "../../domain/errors.ts";
import type {
  AccountProfile,
  CapyAppPort,
  CreateJamInput,
  DeviceCodePoll,
  DeviceCodeStart,
  DeviceInfo,
  JamCreated,
  JamDetail,
  JamEvent,
  Organization,
} from "../../ports/capy-app.ts";
import { requestCapyJson } from "../platform/http.ts";
import { ClerkClient } from "./clerk-client.ts";
import { CAPY_APP, clientHeaders } from "./endpoints.ts";

function itemsOf(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items)) {
    return (body as { items: unknown[] }).items;
  }
  return [];
}

export class CapyAppClient implements CapyAppPort {
  private readonly fetchImpl: typeof fetch;
  private readonly clerk: ClerkClient;

  constructor(fetchImpl: typeof fetch = fetch, clerk = new ClerkClient(fetchImpl)) {
    this.fetchImpl = fetchImpl;
    this.clerk = clerk;
  }

  async sessionJwt(clerk: ClerkSession, signal?: AbortSignal): Promise<string> {
    return this.clerk.sessionJwt(clerk, signal);
  }

  async me(jwt: string, signal?: AbortSignal): Promise<AccountProfile> {
    const body = await this.json(jwt, "/me", { method: "GET", ...(signal ? { signal } : {}) });
    const record = body as Record<string, unknown>;
    const preferences = record.preferences;
    return {
      id: String(record.id ?? ""),
      ...(typeof record.email === "string" ? { email: record.email } : {}),
      ...(typeof record.firstName === "string" ? { firstName: record.firstName } : {}),
      ...(typeof record.lastName === "string" ? { lastName: record.lastName } : {}),
      ...(preferences && typeof preferences === "object" && !Array.isArray(preferences)
        && typeof (preferences as Record<string, unknown>).preferredOrgId === "string"
        ? { preferredOrgId: String((preferences as Record<string, unknown>).preferredOrgId) }
        : {}),
    };
  }

  async organizations(jwt: string, signal?: AbortSignal): Promise<readonly Organization[]> {
    const body = await this.json(jwt, "/organizations", { method: "GET", ...(signal ? { signal } : {}) });
    return itemsOf(body).flatMap((item): Organization[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      if (!id) return [];
      return [{ id, ...(typeof record.name === "string" ? { name: record.name } : {}) }];
    });
  }

  async mintApiKey(
    jwt: string,
    orgId: string,
    name: string,
    signal?: AbortSignal,
  ): Promise<{ plaintext: string; keyId?: string }> {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/api-keys`, {
      method: "POST",
      body: JSON.stringify({ name }),
      ...(signal ? { signal } : {}),
    });
    const record = body as Record<string, unknown>;
    const key = record.key;
    const plaintext = typeof record.plaintext === "string" ? record.plaintext.trim() : "";
    if (!plaintext.startsWith("capy_")) {
      throw new CapyError("upstream_error", "Capy 没有返回 API Key 明文");
    }
    return {
      plaintext,
      ...(key && typeof key === "object" && !Array.isArray(key)
        && typeof (key as Record<string, unknown>).id === "string"
        ? { keyId: String((key as Record<string, unknown>).id) }
        : {}),
    };
  }

  async listDevices(jwt: string, orgId: string, signal?: AbortSignal): Promise<readonly DeviceInfo[]> {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/devices`, {
      method: "GET",
      ...(signal ? { signal } : {}),
    });
    return itemsOf(body).flatMap((item): DeviceInfo[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      if (!id) return [];
      return [{
        id,
        name: typeof record.name === "string" ? record.name : "",
        connected: record.connected === true,
      }];
    });
  }

  async renameDevice(
    jwt: string,
    orgId: string,
    deviceId: string,
    name: string,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.json(
      jwt,
      `/orgs/${encodeURIComponent(orgId)}/devices/${encodeURIComponent(deviceId)}`,
      { method: "PATCH", body: JSON.stringify({ name }), ...(signal ? { signal } : {}) },
    );
  }

  async startDeviceCode(
    jwt: string,
    input: { hostname: string; os: string; arch: string },
    signal?: AbortSignal,
  ): Promise<DeviceCodeStart> {
    const body = await this.json(jwt, "/devices/code", {
      method: "POST",
      body: JSON.stringify({
        hostname: input.hostname,
        os: input.os,
        arch: input.arch,
      }),
      ...(signal ? { signal } : {}),
    });
    const record = body as Record<string, unknown>;
    const userCode = String(record.userCode ?? "").trim();
    const deviceCode = String(record.deviceCode ?? "").trim();
    if (!userCode || !deviceCode) {
      throw new CapyError("upstream_error", "Capy 设备码接口没有返回 userCode/deviceCode");
    }
    return {
      userCode,
      deviceCode,
      verificationUrl: typeof record.verificationUrl === "string" ? record.verificationUrl : "",
      expiresInSeconds: Number(record.expiresInSeconds) || 300,
      pollIntervalSeconds: Math.max(1, Number(record.pollIntervalSeconds) || 5),
    };
  }

  async approveDeviceCode(
    jwt: string,
    orgId: string,
    userCode: string,
    name: string,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/devices/code/approve`, {
      method: "POST",
      body: JSON.stringify({ userCode, name }),
      ...(signal ? { signal } : {}),
    });
  }

  async pollDeviceCode(jwt: string, deviceCode: string, signal?: AbortSignal): Promise<DeviceCodePoll> {
    const body = await this.json(jwt, "/devices/code/poll", {
      method: "POST",
      body: JSON.stringify({ deviceCode }),
      ...(signal ? { signal } : {}),
    });
    const record = body as Record<string, unknown>;
    const status = String(record.status ?? "");
    if (status === "pending" || status === "slow_down") return { status };
    if (status === "denied" || status === "expired") return { status };
    if (status === "approved") {
      const enrolled = record.enrolled;
      if (!enrolled || typeof enrolled !== "object" || Array.isArray(enrolled)) {
        throw new CapyError("upstream_error", "Capy 设备码批准了，但没有 enrolled");
      }
      const e = enrolled as Record<string, unknown>;
      const device = e.device;
      const deviceId = device && typeof device === "object" && !Array.isArray(device)
        ? String((device as Record<string, unknown>).id ?? "")
        : "";
      const token = String(e.token ?? "").trim();
      if (!deviceId || !token.startsWith("capyd_")) {
        throw new CapyError("upstream_error", "Capy 设备码批准了，但没有 deviceId/token");
      }
      return {
        status,
        enrolled: {
          orgId: String(e.orgId ?? ""),
          deviceId,
          name: device && typeof device === "object" && !Array.isArray(device)
            ? String((device as Record<string, unknown>).name ?? "")
            : "",
          token,
        },
      };
    }
    return { status: "pending" };
  }

  async createJam(
    jwt: string,
    orgId: string,
    input: CreateJamInput,
    signal?: AbortSignal,
  ): Promise<JamCreated> {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams`, {
      method: "POST",
      body: JSON.stringify({
        jamId: input.jamId,
        requestId: input.requestId,
        clientKey: input.clientKey,
        message: input.message,
        model: {
          modelId: input.modelId,
          ...(input.reasoningMode ? { reasoningMode: input.reasoningMode } : {}),
        },
        device: {
          deviceId: input.deviceId,
          workspace: { kind: "worktree" },
        },
        ...(input.files && input.files.length > 0 ? { files: input.files } : {}),
        ...(input.promptVariant ? { promptVariant: input.promptVariant } : {}),
      }),
      ...(signal ? { signal } : {}),
    }, input.ads ? { "x-capy-client-features": "message-edit,visual,ads-models" } : {});
    const record = body as Record<string, unknown>;
    const id = String(record.id ?? "").trim();
    if (!id) throw new CapyError("upstream_error", "Capy 创建线程没有返回 id");
    const machine = record.primaryMachine;
    const kind = machine && typeof machine === "object" && !Array.isArray(machine)
      ? String((machine as Record<string, unknown>).kind ?? "")
      : "";
    return {
      id,
      primaryMachine: { kind: kind === "cloud" ? "cloud" : "device" },
    };
  }

  async getJam(jwt: string, orgId: string, jamId: string, signal?: AbortSignal): Promise<JamDetail> {
    const body = await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}`, {
      method: "GET",
      ...(signal ? { signal } : {}),
    });
    const record = body as Record<string, unknown>;
    return {
      id: String(record.id ?? jamId),
      status: String(record.status ?? ""),
      ...(record.ask === null || record.ask && typeof record.ask === "object" ? { ask: record.ask as NonNullable<JamDetail["ask"]> } : {}),
    };
  }

  async getJamEvents(
    jwt: string,
    orgId: string,
    jamId: string,
    signal?: AbortSignal,
  ): Promise<readonly JamEvent[]> {
    const body = await this.json(
      jwt,
      `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}/events?limit=50`,
      { method: "GET", ...(signal ? { signal } : {}) },
    );
    const record = body as { items?: unknown };
    const items = Array.isArray(record.items) ? record.items : [];
    return items.flatMap((item): JamEvent[] => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const value = item as Record<string, unknown>;
      const id = typeof value.id === "string" ? value.id : "";
      const kind = typeof value.kind === "string" ? value.kind : "";
      if (!id || !kind) return [];
      const payload = value.payload && typeof value.payload === "object" && !Array.isArray(value.payload)
        ? value.payload as Record<string, unknown>
        : {};
      return [{
        id,
        kind,
        payload: {
          ...(typeof payload.code === "string" ? { code: payload.code } : {}),
          ...(typeof payload.message === "string" ? { message: payload.message } : {}),
        },
      }];
    });
  }

  async interruptJam(jwt: string, orgId: string, jamId: string, signal?: AbortSignal): Promise<void> {
    await this.json(jwt, `/orgs/${encodeURIComponent(orgId)}/jams/${encodeURIComponent(jamId)}/interrupt`, {
      method: "POST",
      body: "{}",
      ...(signal ? { signal } : {}),
    });
  }

  private async json(
    jwt: string,
    route: string,
    init: RequestInit & { signal?: AbortSignal },
    extraHeaders: Record<string, string> = {},
  ): Promise<unknown> {
    return await requestCapyJson(
      this.fetchImpl,
      `${CAPY_APP}${route}`,
      { ...init, headers: clientHeaders(jwt, extraHeaders) },
      30_000,
    );
  }
}

