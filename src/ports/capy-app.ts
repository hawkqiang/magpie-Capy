import type { ClerkSession } from "../domain/account.ts";

export interface AccountProfile {
  readonly id: string;
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  /** 来自 GET /app/me 的 preferences.preferredOrgId。 */
  readonly preferredOrgId?: string;
}

export interface Organization {
  readonly id: string;
  readonly name?: string;
}

export interface DeviceInfo {
  readonly id: string;
  readonly name: string;
  readonly connected: boolean;
}

export interface DeviceCodeStart {
  readonly userCode: string;
  readonly deviceCode: string;
  readonly verificationUrl: string;
  readonly expiresInSeconds: number;
  readonly pollIntervalSeconds: number;
}

export interface EnrolledDevice {
  readonly orgId: string;
  readonly deviceId: string;
  readonly name: string;
  readonly token: string;
}

export type DeviceCodePoll =
  | { readonly status: "pending" | "slow_down" }
  | { readonly status: "denied" | "expired" }
  | { readonly status: "approved"; readonly enrolled: EnrolledDevice };

export interface JamFile {
  readonly fileId: string;
  readonly name: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
}

export interface CreateJamInput {
  readonly jamId: string;
  readonly requestId: string;
  /** Capy 的幂等键；与 requestId 同值，但协议字段独立。 */
  readonly clientKey: string;
  readonly message: string;
  readonly modelId: string;
  readonly reasoningMode?: string;
  readonly deviceId: string;
  readonly files?: readonly JamFile[];
  readonly promptVariant?: "minimal";
  /** 免费广告模型：服务端要求 `ads-models` 客户端能力位。 */
  readonly ads?: boolean;
}

export interface JamAsk {
  readonly kind: string;
  readonly text?: string;
}

export interface JamCreated {
  readonly id: string;
  readonly primaryMachine: { readonly kind: "device" | "cloud" };
}

export interface JamDetail {
  readonly id: string;
  readonly status: string;
  readonly ask?: JamAsk | null;
}

export interface JamEvent {
  readonly id: string;
  readonly kind: string;
  readonly payload?: {
    readonly code?: string;
    readonly message?: string;
  };
}

export interface CapyAppPort {
  sessionJwt(clerk: ClerkSession, signal?: AbortSignal): Promise<string>;
  me(jwt: string, signal?: AbortSignal): Promise<AccountProfile>;
  organizations(jwt: string, signal?: AbortSignal): Promise<readonly Organization[]>;
  mintApiKey(jwt: string, orgId: string, name: string, signal?: AbortSignal): Promise<{ plaintext: string; keyId?: string }>;
  listDevices(jwt: string, orgId: string, signal?: AbortSignal): Promise<readonly DeviceInfo[]>;
  renameDevice(jwt: string, orgId: string, deviceId: string, name: string, signal?: AbortSignal): Promise<void>;
  startDeviceCode(jwt: string, input: { hostname: string; os: string; arch: string }, signal?: AbortSignal): Promise<DeviceCodeStart>;
  approveDeviceCode(jwt: string, orgId: string, userCode: string, name: string, signal?: AbortSignal): Promise<void>;
  pollDeviceCode(jwt: string, deviceCode: string, signal?: AbortSignal): Promise<DeviceCodePoll>;
  createJam(jwt: string, orgId: string, input: CreateJamInput, signal?: AbortSignal): Promise<JamCreated>;
  getJam(jwt: string, orgId: string, jamId: string, signal?: AbortSignal): Promise<JamDetail>;
  getJamEvents(jwt: string, orgId: string, jamId: string, signal?: AbortSignal): Promise<readonly JamEvent[]>;
  interruptJam(jwt: string, orgId: string, jamId: string, signal?: AbortSignal): Promise<void>;
}

